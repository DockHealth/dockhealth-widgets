# Dock Health Widgets

Widgets allow third party developers to embed UI components into Dock. These components communicate with Dock via a new client-side SDK. The client-side SDK allows the widget to post requests and events to Dock, such as to indicate that a patient call is complete, and allow Dock to post requests and events to the widget, such as to indicate that a given task was completed.

## Use Cases

**Call Center**: Inbound call from or regarding patient causes Dock to navigate to specified patient view.

**Form Completion**: Widget click within Dock causes presentation of inline form to capture additional data into third party system. Widget callback to Dock upon form completion causes completion of task.

**Document Review**: Inline presentation of medical records to be reviewed by user. User completion of review triggers event in Dock, possibly leading to task completion. 
 
## Widget Types

`Task`: Displayed in drawer. Acts within scope of the current task or subtask. 

`Patient`: Displayed in tab in patient view. Acts within scope of the current patient.

## Widget Namespaces

### `dock.events` Namespace

Listens for Dock client-side events generated in the UI hosting the widget. Client-side events follow the Window.postMessage() protocol. Event payloads follow the MessageEvent schema.

Events will be one of the following types:

`onStateChanged`: Sent whenever the current state of the Dock UI has meaningfully changed. In the case of `Task` widgets, this event will be sent whenever the selected task changes. In the case of `Patient` widgets, this event will be sent whenever the selected patient changes. All `onStateChanged` events will include the item that changed, as well as reference attributes like current user, parent task, etc. This event will be sent to a widget whenever it is loaded so that it can properly initialize itself based on the current state.

`onItemChanged`: Sent whenever an attribute of the selected item has meaningfully changed. In the case of `Task` widgets, this event will be sent whenever an attribute of the selected task changes. In the case of `Patient` widgets, this event will be send whenever an attribute of the selected patient changes. The event will include the item that has changed. NOTE: Dock will not send diffs – it is the responsibility of the widget to determine diffs via the initial onStateChanged event and subsequent onItemChanged events.

### `dock.actions` Namespace

Executes Dock client-side actions within the UI. Messages are sent to Dock using the same protocol and schema described above. 

Actions must be one of the following:

`navigate`: Navigate to the specified Task or Patient. Note that an invalid destination will cause Dock to display an error to the user, but otherwise suppress the navigation. Params: 
  - `type`: Must be `patient` or `task`.
  - `id`: Must be the id of the patient or task to which to navigate.

`setAttribute`: Set the specified attribute of the currently-selected item. In the case of Task widgets, this will set an attribute of the currently-selected task. In the case of Patient widgets, which will set an attribute of the currently-selected patient. Params:
  - TODO

`showBanner`: Displays a Dock banner message. Useful for communicating feedback to the user in a familiar location. Params:
  - `message`: The message text to be displayed.

`showModal`: Displays a Dock modal dialog. The dialog will display `Ok` and `Cancel` buttons and call the specified callback when clicked. Params:
  - `title`: The title to be displayed.
  - `message`: The message text to be displayed.
  - `onOk`: Callback when `Ok` is clicked.
  - `onCancel`: Callback when `Cancel` is clicked.

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
  
## Running the Examples

The examples are located in the `examples` folder.

The examples require the installation of two helper binaries in your dev environment:

- serve: <https://www.npmjs.com/package/serve>
- ngrok: <https://dashboard.ngrok.com>

Both binaries need to be in your path to be accessible by npm. 
The easiest way to accomplish this is to install `serve` globally using yarn or npx,
and to install `ngrok` via package manager (e.g., Homebrew for Mac, apt for linux, Chocalatey for Windows).

- First, build the SDK: `npm run build`
- To run the echo example (which gives a better understanding of PostMessage sandboxing): 
  - Use an ngrok config with two endpoints specified -- one to act as the parent, and one to act as the child.
  - Start ngrok with both endpoints: `ngrok start --all`
  - Run serve twice on separate ports, one for each endpoint specified in the ngrok config:
    - `serve -l 5000 .`
    - `serve -l 5001 .`
  - Browse to the parent ngrok URL and navigate to the echo example: <https://dockhealth.ngrok.io>

Sample ngrok config:

```yaml
authtoken: <supply your ngrok auth token here>

tunnels:
  dockhealth:
    proto: http
    addr: 5000
    subdomain: dockhealth
  dockhealth-widget:
    proto: http
    addr: 5001
    subdomain: dockhealth-widget
```

## Next Steps

If you have any trouble, please don't hesitate to reach out for help. Either:

1. Create an issue in this repo: <https://github.com/DockHealth/dockhealth-widgets/issues>.
2. Email us at <mailto://support@dock.health>. 

Thanks for using Dock Health!



