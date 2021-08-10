# Dock Health Widgets

Widgets allow third party developers to embed UI components into Dock. These components communicate with Dock via a new client-side SDK. The client-side SDK allows the widget to post requests and events to Dock, such as to indicate that a patient call is complete, and allow Dock to post requests and events to the widget, such as to indicate that a given task was completed.

## Use Cases

**Call Center**: Inbound call from or regarding patient causes Dock to navigate to specified patient view.

**Form Completion**: Widget click within Dock causes presentation of inline form to capture additional data into third party system. Widget callback to Dock upon form completion causes completion of task.

**Document Review**: Inline presentation of medical records to be reviewed by user. User completion of review triggers event in Dock, possibly leading to task completion. 

## Protocol

Widget protocol follows the `Window.postMessage()` standard: <https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage>

Dock widget events conform to the `MessageEvent` schema: <https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent>
 
## Widget Types

`Task`: Displayed in drawer. Acts within scope of the current task or subtask. 

`Patient`: Displayed in tab in patient view. Acts within scope of the current patient.

## Widget Namespaces

### `dock.events` Namespace

Listens for Dock client-side events generated in the UI hosting the widget. Client-side events follow the Window.postMessage() protocol. Event payloads follow the MessageEvent schema.

Events will be one of the following types:

`stateChanged`: Sent whenever the current state of the Dock UI has meaningfully changed. In the case of `Task` widgets, this event will be sent whenever the selected task changes. In the case of `Patient` widgets, this event will be sent whenever the selected patient changes. All `stateChanged` events will include the item that changed, as well as reference attributes like current user, parent task, etc. This event will be sent to a widget whenever it is loaded so that it can properly initialize itself based on the current state.

`stateWillChange` (FUTURE): Sent whenever the current state of the Dock UI is about to change – for example, when the user is about to navigate away from the current task or patient. This event will provide the widget the opportunity to prevent the navigation until data is saved, etc. The event will include (if possible), the item to which the user is navigating, as well as all reference attributes like current user, etc. 

`itemChanged`: Sent whenever an attribute of the selected item has meaningfully changed. In the case of `Task` widgets, this event will be sent whenever an attribute of the selected task changes. In the case of `Patient` widgets, this event will be send whenever an attribute of the selected patient changes. The event will include the item that has changed. NOTE: Dock will not send diffs – it is the responsibility of the widget to determine diffs via the initial stateChanged event and subsequent itemChanged events.

`itemWillChange` (FUTURE): Sent whenever an attribute of the selected item is about to change – for example, when the user is about to assign a task to another user, or change the address of a patient. This event will provide the widget the opportunity to prevent the change if necessary. The event will include (if possible), the attribute being changed and the tentative new value for the attribute. 

`actionExecuted`: The response to an action. Due to the use of the structured clone algorithm in message passing, function callbacks cannot be passed in `MessageEvents`. Instead the caller must generate a unique `requestId` to accompany each action sent to Dock. Once the action has been executed, Dock will send an `actionExecuted` event to the caller along with the `requestId` of the action. This allows the widget to handle the success or failure of the action.

### `dock.actions` Namespace

Executes Dock client-side actions within the UI. Messages are sent to Dock using the same protocol and schema described above. 

Due to the use of the structured clone algorithm in message passing, function callbacks cannot be passed in `MessageEvents`. Instead the caller must generate a unique `requestId` to accompany each action sent to Dock. Once the action has been executed, Dock will send an `actionExecuted` event to the caller along with the `requestId` of the action. This allows the widget to handle the success or failure of the action.

Actions must be one of the following:

`navigate`: Navigate to the specified Task or Patient. Note that an invalid destination will cause Dock to display an error to the user, but otherwise suppress the navigation.

`setAttribute`: Set the specified attribute of the currently-selected item. In the case of Task widgets, this will set an attribute of the currently-selected task. In the case of Patient widgets, which will set an attribute of the currently-selected patient.

`showBanner`: Displays a Dock banner message. Useful for communicating feedback to the user in a familiar location.

`showModal`: Displays a Dock modal dialog. 

`logout`: Logout the current user. This will cause Dock to redirect to the Login page.

### `dock.fetch` Namespace

Executes Dock client-side requests to fetch data currently loaded in the Dock UI hosting the widget. TBD.

### `dock.session.store` Namespace (FUTURE)

Provides a secure session store within Dock for session-specific widget state and other widget-related data. TBD.

### `dock.api` Namespace (FUTURE)

Executes Dock server-side API calls restricted to the scope of the currently logged-in user. Used to retrieve server-side data that may not be currently present in the UI. TBD.

### `dock.persistent.store` Namespace (FUTURE)

Provides secure server storage within Dock for user-specific state across all instances of all widgets for the given developer. TBD.

## Widget Registration

Widgets are registered via the Dock Health API in much the same way as webhooks.

### `POST /api/v1/developer/widget` 

Registers a widget with the following payload:

`organizationId`: the organization identifier to which the widget will be restricted. Optional. Absence of an organization identifier means that the widget will be loaded for any / all of the developer’s organizations. If a specific organization_id is specified, the widget will only be loaded for the specified organization. IMPORTANT. Must specify a valid organization identifier or the registration will FAIL and the widget will be left in an unverified state.

`url`: the full URL to the widget. Required. Must be unique across ALL widgets. Must be https and be accessible over the public internet at the time the POST is made.

`type`: the type of widget. Required. Must be either task or patient. 

`verificationUrl`: the full URL of the endpoint that will verify widget authenticity. Must be https, be accessible over the public internet at the time the POST is made, and pass an authentication challenge (see the Authentication section, below). The domain of this endpoint MUST be the same domain of the widget, though it and/or the widget may reside on subdomains of the primary domain. A single verification URL can be used to verify all the widgets hosted by that domain.

`secret`: a secret to be used with widget verification. Required. Must be unique for each widget registered across all of Dock Health. Recommend using a SHA-512 hash of a generated value.

`verified`: READ-ONLY. Indicates whether or not the widget has been successfully verified. An unverified widget will not be loaded by Dock. 

`enabled`: flag to instruct Dock whether or not to load the widget. Not required. false by default. Only enabled widgets will be loaded. This does NOT apply to the authentication challenge – the widget MUST be able to respond to the challenge at the time the widget is created!

NOTE: Dock will only load verified widgets. See the Authentication section for more information about widget endpoint verification.

This endpoint requires the dockhealth/system.developer.write scope.

### `PUT /api/v1/developer/widget/{id}` 

Updates the widget for the specified id. All values settable in the POST MUST BE SET HERE. In other words, to make things as clear as possible, there is no PATCH operation! All updates will trigger a re-verification of the widget.

This endpoint requires the dockhealth/system.developer.write scope.

### `DELETE /api/v1/developer/widget/{id}` 

Deletes the widget for the specified id. This is a hard delete. 

This endpoint requires the dockhealth/system.developer.write scope.

### `GET /api/v1/developer/widget`

Returns all widgets for a given developer account.

This endpoint requires the dockhealth/system.developer.read scope.

### `GET /api/v1/developer/widget/{id}` 

Returns the widget for the specified id.

This endpoint requires the dockhealth/system.developer.read scope.

## Widget Authentication

Authentication happens in three ways:

- Dock authenticates the widget during creation or update. This is to verify that the developer actually has control of the domain that hosts the widget.
  - The developer sends a POST request to create the widget or a PUT to update the widget. The request specifies a verification url and a secret.
  - Dock confirms that the widget url domain matches the widget verification_url domain. If they do not match, Dock will set the widget’s verified flag to false, verification will cease, and the widget will not loaded.
  - Dock sends a GET request to the verification url with a message parameter set to some random string. Example: <https://services.mycompany.com/widgets?message=a4c51484-9318-11eb-a8b3-0242ac130003>
  - The developer creates an HMAC hex digest signature of a SHA-256 hash of the message. The signature is created with a key set to the secret that was sent in the initial POST or PUT request, and a message set to the message sent by Dock to the endpoint. The endpoint responds with a 200 and a response body containing a single attribute, digest, set to the digest. Example: `{ “digest”: “eyJraWQiOiJyYTAraGdJUlhDTEZJNlNKY0ladjNMdmVITUJoTDhGTGhO“ }`
  - Dock attempts to verify the signature. If it is correct, Dock sets the endpoint verified flag to true. The widget specified will be loaded by Dock at the appropriate time, provided the widget is enabled. If it is not correct, Dock will set the widget’s verified flag to false, and the widget will not loaded.
- The widget verifies messages sent by Dock:
  - Per the Window.postMessage() protocol and MessageEvent schema, each widget event sent by Dock will contain an origin attribute set to either dev.dockhealth.app (DEVELOPMENT) or app.dock.health(PRODUCTION).
  - The developer SHOULD ALWAYS check that the origin equals an expected Dock Health domain before proceeding. DO NOT EVER process a MessageEvent from an unknown or unexpected origin!
- Dock verifies messages sent by the widget.
  - Dock will confirm that the origin of all messages sent by the widget match the widget’s domain used when it was verified. Dock WILL UNLOAD AND DISABLE any widget that sends even a single message with a missing, unknown, or invalid origin. Any disabled widget will not load until it is re-verified.

## Dock Health API

The Dock Health API Developer Guide and client examples are available at our public
GitHub API repository (this repo): <https://github.com/DockHealth/dockhealth-api>.

The Dock Health API reference is available in three formats - OpenAPI (yaml), Redoc, and Swagger:

- DEVELOPMENT:
  - OpenAPI: <https://partner-api-dev.dockhealth.app/api-docs>
  - Redoc: <https://partner-api-dev.dockhealth.app/api-docs/redoc>
  - Swagger: <https://partner-api-dev.dockhealth.app/api-docs/swagger-ui.html>
- PRODUCTION:
  - OpenAPI: <https://partner-api.dock.health/api-docs>
  - Redoc: <https://partner-api.dock.health/api-docs/redoc>
  - Swagger: <https://partner-api.dock.health/api-docs/swagger-ui.html>
  
## Next Steps

Please see the examples section of this repo for full working examples covering the full widget lifecycle!

Finally, if you have any trouble, please don't hesitate to reach out for help. Either:

1. Create an issue in this repo: <https://github.com/DockHealth/dockhealth-widgets/issues>.
2. Email us at <mailto://support@dock.health>. 

Thanks for using Dock Health!



