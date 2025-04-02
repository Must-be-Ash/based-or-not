# Farcaster Mini Apps

## Context

When your app is opened it can access information about the session from
`sdk.context`. This object provides basic information about the user, the
client, and where your app was opened from:

```ts
export type FrameContext = {
  user: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  location?: FrameLocationContext;
  client: {
    clientFid: number;
    added: boolean;
    safeAreaInsets?: SafeAreaInsets;
    notificationDetails?: FrameNotificationDetails;
  };
};
```

### Properties

#### `location`

Contains information about the context from which the Mini App was launched.

```ts
export type CastEmbedLocationContext = {
  type: 'cast_embed';
  embed: string;
  cast: {
    fid: number;
    hash: string;
  };
};

export type NotificationLocationContext = {
  type: 'notification';
  notification: {
    notificationId: string;
    title: string;
    body: string;
  };
};

export type LauncherLocationContext = {
  type: 'launcher';
};

export type ChannelLocationContext = {
  type: 'channel';
  channel: {
    /**
     * Channel key identifier
     */
    key: string;

    /**
     * Channel name
     */
    name: string;

    /**
     * Channel profile image URL
     */
    imageUrl?: string;
  };
};

export type LocationContext =
  | CastEmbedLocationContext
  | NotificationLocationContext
  | LauncherLocationContext
  | ChannelLocationContext;
```

##### Cast Embed

Indicates that the Mini App was launched from a cast (where it is an embed).

```ts
> sdk.context.location
{
  type: "cast_embed",
  cast: {
    fid: 3621,
    hash: "0xa2fbef8c8e4d00d8f84ff45f9763b8bae2c5c544",
  }
}
```

##### Notification

Indicates that the Mini App was launched from a notification triggered by the frame.

```ts
> sdk.context.location
{
  type: "notification",
  notification: {
    notificationId: "f7e9ebaf-92f0-43b9-a410-ad8c24f3333b"
    title: "Yoinked!",
    body: "horsefacts captured the flag from you.",
  }
}
```

##### Launcher

Indicates that the Mini App was launched directly by the client app outside of a context, e.g. via some type of catalog or a notification triggered by the client.

```ts
> sdk.context.location
{
  type: "launcher"
}
```

#### `user`

Details about the calling user which can be used to customize the interface. This should be considered untrusted since it is passed in by the application, and there is no guarantee that it was authorized by the user.

```ts
export type AccountLocation = {
  placeId: string;

  /**
   * Human-readable string describing the location
   */
  description: string;
};

export type UserContext = {
  fid: number;
  username?: string;
  displayName?: string;

  /**
   * Profile image URL
   */
  pfpUrl?: string;
  location?: AccountLocation;
};
```

```ts
> sdk.context.user
{
  "fid": 6841,
  "username": "deodad",
  "displayName": "Tony D'Addeo",
  "pfp": "https://i.imgur.com/dMoIan7.jpg",
  "bio": "Building @warpcast and @farcaster, new dad, like making food",
  "location": {
    "placeId": "ChIJLwPMoJm1RIYRetVp1EtGm10",
    "description": "Austin, TX, USA"
  }
}
```

```ts
type User = {
  fid: number;
  username?: string;
  displayName?: string;
  pfp?: string;
  bio?: string;
  location?: {
    placeId: string;
    description: string;
  };
};
```

#### client

Details about the Farcaster client running the Mini App. This should be considered untrusted

* `clientFid`: the self-reported FID of the client (e.g. 9152 for Warpcast)
* `added`: whether the user has added the Mini App to the client
* `safeAreaInsets`: insets to avoid areas covered by navigation elements that obscure the view
* `notificationDetails`: in case the user has enabled notifications, includes the `url` and `token` for sending notifications

```ts
export type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type ClientContext = {
  clientFid: number;
  added: boolean;
  notificationDetails?: FrameNotificationDetails;
  safeAreaInsets?: SafeAreaInsets;
};
```

```ts
> sdk.context.client
{
  clientFid: 9152,
  added: true,
  safeAreaInsets: {
    top: 0,
    bottom: 20,
    left: 0,
    right: 0,
  };
  notificationDetails: {
    url: "https://api.warpcast.com/v1/frame-notifications",
    token: "a05059ef2415c67b08ecceb539201cbc6"
  }
}
```

```ts
type FrameNotificationDetails = {
  url: string;
  token: string;
};

type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type ClientContext = {
  clientFid: number;
  added: boolean;
  safeAreaInsets?: SafeAreaInsets;
  notificationDetails?: FrameNotificationDetails;
};
```

##### Using safeAreaInsets

Mobile devices render navigation elements that obscure the view of an app. Use
the `safeAreaInsets` to render content in the safe area that won't be obstructed.

A basic usage would to wrap your view in a container that adds margin:

```
<div style={{
  marginTop: context.client.safeAreaInsets.top,
  marginBottom: context.client.safeAreaInsets.bottom,
  marginLeft: context.client.safeAreaInsets.left,
  marginRight: context.client.safeAreaInsets.right,
}}>
  ...your app view
</div>
```

However, you may want to set these insets on specific elements: for example if
you have tab bar at the bottom of your app with a different background, you'd
want to set the bottom inset as padding there so it looks attached to the
bottom of the view.


## Client Events

When a user interacts with your app events will be sent from the Farcaster
client to your application client.

Farcaster clients emit events to directly to your app client while it is open that can
be used to update your UI in response to user actions.

To listen to events, you have to use `sdk.on` to register callbacks ([see full
example](https://github.com/farcasterxyz/frames-v2-demo/blob/20d454f5f6b1e4f30a6a49295cbd29ca7f30d44a/src/components/Demo.tsx#L92-L124)).

Listeners can be cleaned up with `sdk.removeListener()` or sdk.removeAllListeners()\`.

### Events

#### frameAdded

The user added the Mini App.

#### frameRemoved

The user removed the Mini App.

#### notificationsEnabled

The user enabled notifications after previously having them disabled.

#### notificationsDisabled

The user disabled notifications.


## Getting Started

import { Caption } from '../../components/Caption';

### Overview

Mini apps are web apps built with HTML, CSS, and Javascript that can be discovered
and used within Farcaster clients. You can use an SDK to access native
Farcaster features, like authentication, sending notifications, and interacting
with the user's wallet.

### Quick Start

For new projects, you can set up an app using the
[@farcaster/create-mini-app](https://github.com/farcasterxyz/frames/tree/main/packages/create-mini-app)
CLI. This will prompt you to set up a project for your app.

:::code-group
```bash [npm]
npm create @farcaster/mini-app
```

```bash [pnpm]
pnpm create @farcaster/mini-app
```

```bash [yarn]
yarn create @farcaster/mini-app
```
:::

Remember, you can use whatever your favorite web framework is to build Mini
Apps so if these options aren't appealing you can setup the SDK in your own
project by following the instructions below.

### Manual Setup

For existing projects, install the Frames SDK:

#### Package Manager

:::code-group
```bash [npm]
npm install @farcaster/frame-sdk
```

```bash [pnpm]
pnpm add @farcaster/frame-sdk
```

```bash [yarn]
yarn add @farcaster/frame-sdk
```
:::

#### CDN

If you're not using a package manager, you can also use the Frame SDK via an
ESM-compatible CDN such as esm.sh. Simply add a `<script type="module">` tag to
the bottom of your HTML file with the following content.

```html
<script type="module">
  import { sdk } from 'https://esm.sh/@farcaster/frame-sdk'
</script>
```

### Building with AI

These docs are LLM friendly so that you use the latest models to build your
applications.

1. Use the Ask in ChatGPT buttons available on each page to interact with the
   documentation.

<video autoPlay muted playsInline loop>
  <source src="/ask_in_chatgpt.mp4" type="video/mp4" />

  Your browser does not support the video tag.
</video>

2. Use the <a class="vocs_Anchor vocs_Link vocs_Link_accent" href="/llms-full.txt">llms-full.txt</a> to keep your LLM up to date with these docs:

<picture>
  <img alt="setup mini app docs in cursor" src="/cursor-setup.png" width="auto" />
</picture>

<br />

<Caption>
  Adding the Mini App docs to Cursor
</Caption>

#### How does this work?

This entire site is converted into a single markdown doc that can fit inside
the context window of most LLMs. See [The /llms.txt file](https://llmstxt.org/)
standards proposal for more information.

### Next Steps

You'll need to do a few more things before distributing your app to users:

1. publish the app by providing information about who created it and how it should displayed
2. make it sharable in feeds


## Specification

A frame is full-screen application that renders inside a Farcaster app.

It can be embedded in feeds in a compact form which includes an image and a button which opens the frame. When the button is clicked the frame URL is rendered in an in-app browser. Developers can build anything that renders in a browser and can use a JavaScript SDK to trigger actions like saving the frame or requesting an onchain transaction.

<img width="1330" alt="Screenshot 2024-11-20 at 7 28 48 PM" src="https://github.com/user-attachments/assets/9d076056-f8df-46dd-8630-e8caf5b3def4" />

Frames will have access to:

1. Context: information about the user's Farcaster account and where the frame was called from
2. Actions: APIs to request the parent app to do certain things on the frame's behalf
3. Wallet: an Ethereum provider to request transactions and signatures from the connected wallet

Here's an example of a frame using a wallet to complete a transaction:

![https://github.com/user-attachments/assets/140213e1-eec8-4a67-8238-b05ac5ad7423](https://github.com/user-attachments/assets/140213e1-eec8-4a67-8238-b05ac5ad7423)

### Frame URL Specifications

A URL is considered a valid frame if it includes an embed tag in its HTML `<head>`. An optional manifest file at a well known location at the root of the domain can be provided for additional provenance and appearance information for Farcaster clients.

#### Versioning

Frames will follow [semantic versioning](https://semver.org/) and frames must declare the version that they support. Apps will choose to render frames based on the versions they can support.

<a name="frame-embed-metatags" />

#### Frame Embed Metatags

A frame URL must have a FrameEmbed in a serialized form in the `fc:frame` meta tag in the HTML `<head>`. When this URL is rendered in a cast, the image is displayed in a 3:2 ratio with a button underneath. Clicking the button will open an app frame to the provided action url and use the splash page to animate the transition.

```html
<meta name="fc:frame" content="<stringified FrameEmbed JSON>" />
```

```ts
type FrameEmbed = {
  // Frame spec version. Required.
  // Example: "next"
  version: 'next';

  // Frame image.
  // Max 512 characters.
  // Image must be 3:2 aspect ratio and less than 10 MB.
  // Example: "https://yoink.party/img/start.png"
  imageUrl: string;

  // Button attributes
  button: {
    // Button text.
    // Max length of 32 characters.
    // Example: "Yoink Flag"
    title: string;

    // Action attributes
    action: {
      // Action type. Must be "launch_frame".
      type: 'launch_frame';

      // App name
      // Max length of 32 characters.
      // Example: "Yoink!"
      name: string;

      // Frame launch URL.
      // Max 512 characters.
      // Example: "https://yoink.party/"
      url: string;

      // Splash image URL.
      // Max 512 characters.
      // Image must be 200x200px and less than 1MB.
      // Example: "https://yoink.party/img/splash.png"
      splashImageUrl: string;

      // Hex color code.
      // Example: "#eeeee4"
      splashBackgroundColor: string;
    };
  };
};
```

#### Frame Manifest

The manifest file declares the metadata that is applied to the frame application served from this domain. It also defines triggers that indicate which actions it supports from trigger points like casts and the composer.

Frame should provide a JSON manifest file on their domain at the well known URI `/.well-known/farcaster.json`.

```ts
type FarcasterManifest = {
  // Metadata associating the domain with a Farcaster account
  accountAssociation: {
    // base64url encoded JFS header.
    // See FIP: JSON Farcaster Signatures for details on this format.
    header: string;

    // base64url encoded payload containing a single property `domain`
    payload: string;

    // base64url encoded signature bytes
    signature: string;
  };

  // Frame configuration
  frame: FrameConfig;

  // Trigger configuration
  triggers?: TriggerConfig[];
};
```

<a name="domain-account-association" />

**Domain Account Association**

The account association links the domain to a Farcaster account. The signature must be a signed [JSON Farcaster Signature](https://github.com/farcasterxyz/protocol/discussions/208) from the account's custody address with the following payload:

```ts
{
  domain: string;
}
```

The domain in the signed object must match the domain the manifest is served from.

**Frame Config**

```ts
type FrameConfig = {
  // Manifest version. Required.
  version: '1';

  // App name. Required.
  // Max length of 32 characters.
  // Example: "Yoink!"
  name: string;

  // Default launch URL. Required.
  // Max 512 characters.
  // Example: "https://yoink.party/"
  homeUrl: string;

  // Frame application icon URL.
  // Max 512 characters.
  // Image must be 200x200px and less than 1MB.
  // Example: "https://yoink.party/img/icon.png"
  iconUrl: string;

  // Default image to show when frame is rendered in a feed.
  // Max 512 characters.
  // Image must have a 3:2 ratio.
  // Example: "https://yoink.party/framesV2/opengraph-image"
  imageUrl: string;

  // Default button title to use when frame is rendered in a feed.
  // Max 32 characters.
  // Example: "🚩 Start"
  buttonTitle: string;

  // Splash image URL.
  // Max 512 characters.
  // Image must be 200x200px and less than 1MB.
  // Example: "https://yoink.party/img/splash.png"
  splashImageUrl?: string;

  // Hex color code.
  // Example: "#eeeee4"
  splashBackgroundColor?: string;

  // URL to which clients will POST events.
  // Max 512 characters.
  // Required if the frame application uses notifications.
  // Example: "https://yoink.party/webhook"
  webhookUrl?: string;
};
```

**Frame Invocation**

Frames may be invoked in the following ways. When invoked, the frame application may receive additional information about the context in which it was launched.

| Type         | Description                                                                                                                                           | Context                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| global       | Called when the app is invoked from the app launcher or any other unspecified context. Loads the `homeUrl` defined in the frame application manifest. | None                                                              |
| embed        | Called when the frame is invoked from an embed in a feed or direct cast. Loads the `url` specified in the FrameEmbed metadata.                        | Cast hash, embed URL, embed type (feed or direct cast), see below |
| notification | Called when a user taps/clicks a frame notification. Loads the `targetUrl` specified in the notification payload.                                     | Notification ID, see below                                        |

**Triggers**

Triggers allow a user to launch into your frame application from different places in a Farcaster client application. These will eventually replace "cast actions" and "composer actions." See [Feature: Triggers](#feature-triggers) in the Appendix for further details.

```ts
type TriggerConfig =
  | {
      // Type of trigger, either cast or composer. Required.
      type: 'cast';

      // Unique ID. Required. Reported to the frame.
      // Example: "yoink-score"
      id: string;

      // Handler URL. Required.
      // Example: "https://yoink.party/triggers/cast"
      url: string;

      // Name override. Optional, defaults to FrameConfig.name
      // Example: "View Yoink Score"
      name?: string;
    }
  | {
      type: 'composer';
      id: string;
      url: string;
      name?: string;
    };
```

The frame receives the trigger type and id as context data.

**Frame manifest caching**

Farcaster clients may cache the frame manifest when scraping embeds, but should provide a mechanism for refreshing the manifest file.

#### Frame UI Specifications

![https://github.com/user-attachments/assets/66cba3ca-8337-4644-a3ac-ddc625358390](https://github.com/user-attachments/assets/66cba3ca-8337-4644-a3ac-ddc625358390)

**Header**

Clients should render a header above the frame that includes the name and author specified in the manifest. Clients should show the header whenever the app frame is launched.

**Splash Screen**

Clients should show a splash screen as soon as the app is launched. The icon and background must be specified in the frame manifest or embed meta tags. The frame can hide the splash screen once loading is complete.

**Size & Orientation**

A frame should be rendered in a vertical modal. Mobile frame sizes will be dictated by device dimensions while web frame sizes will be set to 424x695px.

### Client SDK API

Frame applications must include a frame SDK JavaScript package to communicate with the parent app. Frames may include it as a bundled package or using a `<script>` tag.

The frame SDK manages frame-client communication over a `window.postMessage` channel. Since the parent app cannot inject arbitrary JavaScript in a browser context, frame applications must include the SDK in their app to establish a communication channel.

The `sdk.context` variable provides information about the context within which the frame is running:

```ts
export type FrameContext = {
  user: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  location?: FrameLocationContext;
  client: {
    clientFid: number;
    added: boolean;
    safeAreaInsets?: SafeAreaInsets;
    notificationDetails?: FrameNotificationDetails;
  };
};
```

#### context.location

Contains information about the context from which the frame was launched.

```ts
export type CastEmbedLocationContext = {
  type: 'cast_embed';
  embed: string;
  cast: {
    fid: number;
    hash: string;
  };
};

export type NotificationLocationContext = {
  type: 'notification';
  notification: {
    notificationId: string;
    title: string;
    body: string;
  };
};

export type LauncherLocationContext = {
  type: 'launcher';
};

export type ChannelLocationContext = {
  type: 'channel';
  channel: {
    /**
     * Channel key identifier
     */
    key: string;

    /**
     * Channel name
     */
    name: string;

    /**
     * Channel profile image URL
     */
    imageUrl?: string;
  };
};

export type LocationContext =
  | CastEmbedLocationContext
  | NotificationLocationContext
  | LauncherLocationContext
  | ChannelLocationContext;
```

**Cast Embed**

Indicates that the frame was launched from a cast (where it is an embed).

```ts
> sdk.context.location
{
  type: "cast_embed",
  cast: {
    fid: 3621,
    hash: "0xa2fbef8c8e4d00d8f84ff45f9763b8bae2c5c544",
  }
}
```

**Notification**

Indicates that the frame was launched from a notification triggered by the frame.

```ts
> sdk.context.location
{
  type: "notification",
  notification: {
    notificationId: "f7e9ebaf-92f0-43b9-a410-ad8c24f3333b"
    title: "Yoinked!",
    body: "horsefacts captured the flag from you.",
  }
}
```

**Launcher**

Indicates that the frame was launched directly by the client app outside of a context, e.g. via some type of catalog or a notification triggered by the client.

```ts
> sdk.context.location
{
  type: "launcher"
}
```

#### context.user

Details about the calling user which can be used to customize the interface. This should be considered untrusted since it is passed in by the application, and there is no guarantee that it was authorized by the user.

```ts
export type AccountLocation = {
  placeId: string;

  /**
   * Human-readable string describing the location
   */
  description: string;
};

export type UserContext = {
  fid: number;
  username?: string;
  displayName?: string;

  /**
   * Profile image URL
   */
  pfpUrl?: string;
  location?: AccountLocation;
};
```

```ts
> sdk.context.user
{
  "fid": 6841,
  "username": "deodad",
  "displayName": "Tony D'Addeo",
  "pfp": "https://i.imgur.com/dMoIan7.jpg",
  "bio": "Building @warpcast and @farcaster, new dad, like making food",
  "location": {
    "placeId": "ChIJLwPMoJm1RIYRetVp1EtGm10",
    "description": "Austin, TX, USA"
  }
}
```

```ts
type User = {
  fid: number;
  username?: string;
  displayName?: string;
  pfp?: string;
  bio?: string;
  location?: {
    placeId: string;
    description: string;
  };
};
```

#### context.client

Details about the Farcaster client running the frame. This should be considered untrusted

* `clientFid`: the self-reported FID of the client (e.g. 9152 for Warpcast)
* `added`: whether the user has added the frame to the client
* `safeAreaInsets`: insets to avoid areas covered by navigation elements that obscure the view
* `notificationDetails`: in case the user has enabled notifications, includes the `url` and `token` for sending notifications

```ts
export type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type ClientContext = {
  clientFid: number;
  added: boolean;
  notificationDetails?: FrameNotificationDetails;
  safeAreaInsets?: SafeAreaInsets;
};
```

```ts
> sdk.context.client
{
  clientFid: 9152,
  added: true,
  safeAreaInsets: {
    top: 0,
    bottom: 20,
    left: 0,
    right: 0,
  };
  notificationDetails: {
    url: "https://api.warpcast.com/v1/frame-notifications",
    token: "a05059ef2415c67b08ecceb539201cbc6"
  }
}
```

```ts
type FrameNotificationDetails = {
  url: string;
  token: string;
};

type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

type ClientContext = {
  clientFid: number;
  added: boolean;
  safeAreaInsets?: SafeAreaInsets;
  notificationDetails?: FrameNotificationDetails;
};
```

##### Using safeAreaInsets

Mobile devices render navigation elements that obscure the view of a frame. Use
the `safeAreaInsets` to render content in the safe area that won't be obstructed.

A basic usage would to wrap your view in a container that adds margin:

```
<div style={{
  marginTop: context.client.safeAreaInsets.top,
  marginBottom: context.client.safeAreaInsets.bottom,
  marginLeft: context.client.safeAreaInsets.left,
  marginRight: context.client.safeAreaInsets.right,
}}>
  ...your frame view
</div>
```

However, you may want to set these insets on specific elements: for example if
you have tab bar at the bottom of your frame with a different background, you'd
want to set the bottom inset as padding there so it looks attached to the
bottom of the view.

#### actions.ready

Indicates that the application is fully loaded and ready to displayed to users. Once this is called the loading screen will be hidden. Frame applications MUST call `ready()` to display their app.

```ts
> await sdk.actions.ready();
```

```ts
type Ready = (
  options: Partial<{
    /**
     * Disable native gestures. Use this option if your frame uses gestures
     * that conflict with native gestures.
     */
    disableNativeGestures: boolean;
  }>
) => Promise<void>;
```

#### actions.openUrl

Request the client app to direct the user to an external URL via deep link or web browser.

```ts
> await sdk.actions.openUrl({ url: "<https://yoink.today/>" });
```

```ts
type OpenExternalUrl = (options: {
  url: string;
  close?: boolean;
}) => Promise<void>;
```

#### actions.close

Close the app frame and display an optional toast.

```ts
> await sdk.actions.close({ toast: {
    message: "You yoinked the flag from @deodad."
  }
});
```

```ts
type Close = (options: {
  toast?: {
    message: string;
  };
}) => Promise<void>;
```

#### wallet.ethProvider

An [EIP-1193 Ethereum Provider](https://eips.ethereum.org/EIPS/eip-1193) for interacting with the user’s connected wallet. App Frames can interact with this provider using familiar tools like [wagmi](https://wagmi.sh/) to:

* get the user’s connected Ethereum addresses (`eth_requestAccounts`)
* request a transaction (`eth_sendTransaction`)
* request a wallet signature (`eth_signTypedData_v4`)

```ts
> await sdk.wallet.ethProvider.request({
  method: 'eth_requestAccounts'
});
["0xf17e02c56D8c86767c12332571C91BB29ae302f3"]
```

## Rationale

#### FAQ

**What about older frame types / cast actions / composer actions / mini-apps?**

Older frame types will be fully supported for now until we develop a thorough transition plan. We will give developers at least 3 months notice before deprecating anything.

## Release Plan

### Schedule

* Nov 22nd: new draft of spec, mobile playground
* Nov 27th: v0.0.0 of frames on mobile
* Dec 6th+: v0.1.0 of frames on mobile and web (scope tbd, but likely includes auth, add frame, notifications)
* Jan/Feb: stable release of v1.0.0

### Changelog

| Date  | Version | Changes                         |
| ----- | ------- | ------------------------------- |
| Dec 2 | 0.0.1   | Copy edits, update release plan |

## Appendix

### Feature: Auth

Allow users to sign into frames using their Farcaster identity.

#### actions.signIn

Initiates a Sign In with Farcaster flow for the user. The Frame host must set
the `domain` value of the SIWF message to the domain of the frame and the `uri`
value of the url of the Frame. When validating this message the `domain` must
be checked.

```ts
> await sdk.actions.signIn({ nonce });
{ message: "yoink.party wants you to sign in...", signature: "0xabcd..." }
```

```ts
export type SignInOptions = {
  /**
   * A random string used to prevent replay attacks.
   */
  nonce: string;

  /**
   * Start time at which the signature becomes valid.
   * ISO 8601 datetime.
   */
  notBefore?: string;

  /**
   * Expiration time at which the signature is no longer valid.
   * ISO 8601 datetime.
   */
  expirationTime?: string;
};

export type SignInResult = {
  signature: string;
  message: string;
};

export type SignIn = (options: SignInOptions) => Promise<SignInResult>;
```

### Feature: Add frame

The user can add a frame to their Farcaster app, either through an SDK action or directly (from a deep link, catalog page, etc). The Farcaster app should make it easy to find this saved frame in their UI and accept notifications from the app developer and deliver them to the user. For example, a frame which monitors onchain prices could notify users when the price of something exceeds a certain threshold.

![https://github.com/user-attachments/assets/b3d7fd68-b763-4f28-897a-f3a24cfc01fe](https://github.com/user-attachments/assets/b3d7fd68-b763-4f28-897a-f3a24cfc01fe)

**Request add frame**

Asks the user to add the frame to the Farcaster app, which allows the user to invoke the frame from a cast, composer or other locations in the app. Also allows the app to send notifications to the user.

#### actions.addFrame

Request the user to add the frame, which adds it to the user's favorites list and allows the frame server to send in-app notifications to the user. The Farcaster client is expected to prompt the user for confirmation. Per session, only a single prompt should be shown (repeated calls to `addFrame()` should immediately result in a. `rejected_by_user` error). When the client supports notifications, returns a `notificationDetails` object with a notification callback URL and token.

![https://github.com/user-attachments/assets/cdc36744-7a20-4666-996b-ad2003f0afb9](https://github.com/user-attachments/assets/cdc36744-7a20-4666-996b-ad2003f0afb9)

```ts
> await sdk.actions.addFrame();
{
  "type": "success",
  "notificationDetails": {
    "url": "https://api.warpcast.com/v1/frame-notifications",
    "token": "a05059ef2415c67b08ecceb539201cbc6"
  }
}
```

```ts
type FrameNotificationDetails = {
  url: string;
  token: string;
};

export type AddFrameRejectedReason =
  | 'invalid_domain_manifest'
  | 'rejected_by_user';

export type AddFrameResult =
  | {
      added: true;
      notificationDetails?: FrameNotificationDetails;
    }
  | {
      added: false;
      reason: AddFrameRejectedReason;
    };

export type AddFrame = () => Promise<AddFrameResult>;
```

There are 2 expected failure conditions which the frame should gracefully handle:

* `invalid_domain_manifest`: The frame domain manifest is invalid. The frame developer should use the developer tools to validate and fix their manifest.
* `rejected_by_user`: Returned when the user rejects/dismisses the prompt asking them to add the frame, or the frame has triggered `addFrame()` more than once per session.

### Feature: Social

#### actions.viewProfile

Opens a native modal element with information about a Farcaster account.

```ts
> await sdk.actions.viewProfile({ fid });
```

```ts
export type ViewProfileOptions = {
  /**
   * FID of the account to view profile of
   */
  fid: string;
};
```

### Feature: Server Events

The Farcaster client server POSTs 4 types of events to the frame server at the `webhookUrl` specified in its frame manifest:

* `frame_added`
* `frame_removed`
* `notifications_enabled`
* `notifications_disabled`

The body looks like this:

Events use the [JSON Farcaster Signature](https://github.com/farcasterxyz/protocol/discussions/208) format and are signed with the app key of the user. The final format is:

```
{
  header: string;
  payload: string;
  signature: string;
}
```

All 3 values are `base64url` encoded. The payload and header can be decoded to JSON, where the payload is different per event.

#### `frame_added`: frame added to a client

This event may happen when an open frame calls `actions.addFrame` to prompt the user to favorite it, or when the frame is closed and the user adds the frame elsewhere in the client application (e.g. from a catalog).

Adding a frame includes enabling notifications.

The Farcaster app server generates a unique `notificationToken` and sends it together with the `notificationUrl` that the frame must call, to both the Farcaster app client and the frame server. Client apps must generate unique tokens for each user.

The app client then resolves the `actions.addFrame` promise so the frame can react immediately (without having to check its server).

This is the flow for an open frame:

![Screenshot 2024-11-26 at 16 02 24](https://github.com/user-attachments/assets/00a79f2e-265b-4ec1-831f-28b3a2a6b6de)

This is the flow when the frame is not open; only the backend part runs:

![Screenshot 2024-11-26 at 16 02 35](https://github.com/user-attachments/assets/aae4d453-92f7-46c0-a44f-b0597e58fa43)

Webhook payload:

```
{
  "event": "frame-added",
  "notificationDetails": {
    "url": "https://api.warpcast.com/v1/frame-notifications",
    "token": "a05059ef2415c67b08ecceb539201cbc6"
  }
}
```

```ts
type EventFrameAddedPayload = {
  event: 'frame_added';
  notificationDetails?: FrameNotificationDetails;
};
```

#### `frame_removed`: user removed frame from client

A user can remove a frame, which means that any notification tokens for that fid and client app (based on signer requester) should be considered invalid:

![Screenshot 2024-11-26 at 16 02 40](https://github.com/user-attachments/assets/079dfb74-77e4-47c8-b2e7-1b4628d1f162)

Webhook payload:

```
{
  "event": "frame-removed"
}
```

#### `notifications_disabled`: user disabled notifications

A user can disable frame notifications from e.g. a settings panel in the client app. Any notification tokens for that fid and client app (based on signer requester) should be considered invalid:

![Screenshot 2024-11-26 at 16 03 04](https://github.com/user-attachments/assets/bcca0f58-3656-4a8c-bff8-8feda97bdc54)

Webhook payload:

```
{
  "event": "notifications_disabled"
}
```

#### `notifications_enabled`: user enabled notifications

A user can enable frame notifications (e.g. after disabling them). The client backend again sends a `notificationUrl` and a `token`, with a backend-only flow:

![Screenshot 2024-11-26 at 16 02 48](https://github.com/user-attachments/assets/3ead1768-2efc-4785-9d4a-3a399f2dd0e6)

Webhook payload:

```
{
  "event": "notifications-enabled",
  "notificationDetails": {
    "url": "https://api.warpcast.com/v1/frame-notifications",
    "token": "a05059ef2415c67b08ecceb539201cbc6"
  }
}
```

```ts
type EventNotificationsEnabledPayload = {
  event: 'notifications_enabled';
  notificationDetails: FrameNotificationDetails;
};
```

### Feature: Frame Events

Farcaster clients emit events to your frame, while it is open, to let you know of actions the user takes.

To listen to events, you have to use `sdk.on` to register callbacks ([see full example](https://github.com/farcasterxyz/frames-v2-demo/blob/20d454f5f6b1e4f30a6a49295cbd29ca7f30d44a/src/components/Demo.tsx#L92-L124)).

```ts
sdk.on('frameAdded', ({ notificationDetails }) => {
  setLastEvent(
    `frameAdded${!!notificationDetails ? ', notifications enabled' : ''}`
  );

  setAdded(true);
  if (notificationDetails) {
    setNotificationDetails(notificationDetails);
  }
});
```

Ensure that on unmount/close, all the listeners are removed via `sdk.removeAllListeners()`.

Here are the callback definitions:

```ts
export type EventMap = {
  frameAdded: ({
    notificationDetails,
  }: {
    notificationDetails?: FrameNotificationDetails;
  }) => void;
  frameAddRejected: ({ reason }: { reason: AddFrameRejectedReason }) => void;
  frameRemoved: () => void;
  notificationsEnabled: ({
    notificationDetails,
  }: {
    notificationDetails: FrameNotificationDetails;
  }) => void;
  notificationsDisabled: () => void;
};
```

The emitted events are:

* `frameAdded`, same as the `frame_added` webhook
* `frameAddRejected`, frontend-only, emitted when the frame has triggered the `addFrame` action and the frame was not added. Reason is the same as in the return value of `addFrame`. Deprecated in favor of rejected promise, will be removed in a future version.
* `frameRemoved`, same as the `frame_removed` webhook
* `notificationsEnabled`, same as the `notifications_enabled` webhook
* `notificationsDisabled`, same as the `notifications_disabled` webhook

### Feature: Notifications API

A frame server can send notifications to one or more users who have enabled them.

The frame server is given an authentication token and a URL which they can use to push a notification to the specific Farcaster app that invoked the frame. This is private and must be done separately for each Farcaster app that a user may use.

![Screenshot 2024-11-27 at 16 50 36](https://github.com/user-attachments/assets/9b23ca16-a173-49a9-aa9f-7bc80c8abcf8)

The frame server calls the `notificationUrl` with:

* `notificationId`: a string (max size 128) that serves as an idempotency key and will be passed back to the frame via context. A Farcaster client should deliver only one notification per user per `notificationId`, even if called multiple times.
* `title`: title of the notification, max length of 32 characters
* `body`: body of the notification
* `targetUrl`: the target frame URL to open when a user clicks the notification. It must match the domain for which the notification token was issued.
* `tokens`: an array of tokens (for that `notificationUrl`) to send the notification to. Client servers may impose a limit here, e.g. max 10000 tokens.

Client servers may also impose a rate limit per `token`, e.g. 5 sends per 5 minutes.

The response from the client server must be an HTTP 200 OK, with the following 3 arrays:

* `successTokens`: tokens for which the notification succeeded
* `invalidTokens`: tokens which are no longer valid and should never be used again. This could happen if the user disabled notifications but for some reason the frame server has no record of it.
* `rateLimitedTokens`: tokens for which the rate limit was exceeded. Frame server can try later.

Once a user has been notified, when clicking the notification the client app will:

* Open `targetUrl`
* Set the context to the notification, see `NotificationLaunchContext`

Farcaster apps should:

1. Display a list of added frames somewhere in their UI, allowing the user to enable/disable notifications.
2. Show notifications from added frames along with other in-app notifications.

<a name="feature-triggers" />

### Feature: Triggers

#### Contexts

A frame can be launched from different contexts like a cast or direct message. In each case, the frame app receives a context object that contains information about how the frame was triggered. The context may also define what SDK functions are available. For example, a "translate" frame launched from the `composer` context will have a method that allows it to update the cast being written, while one triggered from a `cast` context in the feed will only get the contents of the cast.

Contexts unify cast actions, composer actions, frames and mini-apps into a single standard, instead of having custom flows for each of these features.

A single frame may expose multiple cast and composer triggers via the TriggerConfig in its frame application manifest. When invoked, the context will include the ID of the trigger that was activated.

We intend to introduce additional triggers in the future, replacing "cast actions" and "composer actions" and introducing new launch contexts:

| Trigger  | Description                                                         | Context                                        |
| -------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| cast     | Called when the app is invoked from a cast. (aka “cast action”)     | Cast hash, cast content, author ID, trigger ID |
| composer | Called when invoked from the cast composer. (aka “composer action”) | Cast parent, text, embeds, trigger ID          |
| channel  | Called when invoked from a channel profile                          | Channel key                                    |
| user     | Called when invoked from a user profile                             | User ID                                        |

**Context types**

```ts
type CastLaunchContext = {
  type: 'cast';
  triggerId: string; // comes from TriggerConfig
  cast: Cast;
};

type ComposerLaunchContext = {
  type: 'composer';
  triggerId: string; // comes from TriggerConfig
  cast: {
    parent?: string;
    text?: string;
    embeds?: string[];
  };
};

type ChannelLaunchContext = {
  type: 'channel';
  channel: {
    key: string;
    name: string;
    imageUrl: string;
  };
};

type UserLaunchContext = {
  type: 'user';
  profile: User;
};

type LinkLaunchContext = {
  type: 'link';
  url: string;
};

type DirectCastEmbedLaunchContext = {
  type: 'direct_cast_embed';
};
```

```ts
> sdk.context.location
{
  type: "cast_embed",
  cast: {
    fid: 3621,
    hash: "0xa2fbef8c8e4d00d8f84ff45f9763b8bae2c5c544",
    text: "New Yoink just dropped:",
    embeds: ["https://yoink.party/frames"]
  }
}
```

### Feature: Primary Button

#### actions.setPrimaryButton

**Action Button**

A native action button may be rendered via an SDK call which provides a clear and consistent call to action for the user. The app frame can specify the text, color mode and callback function. This is optional and frames may choose to implement their own user interface using UI components inside the web view.

Set the Primary Button.

```ts
> await sdk.actions.setPrimaryButton({ text: "Yoink!" });
```

```ts
type SetPrimaryButton = (options: {
  text: string;
  enabled?: boolean;
  hidden?: boolean;
}) => Promise<void>;
```

An app frame should subscribe to the `primaryButtonClicked` event to respond to interactions.

#### primaryButtonClicked (Event)

Emitted when user clicks the Primary Button.

```ts
> Farcaster.events.on("primaryButtonClicked", () => {
    console.log("clicked!") }
);
```


import { Caption } from '../../components/Caption';

## Wallet

![users taking onchain action from app](/transaction-preview.png)

<Caption>
  A user minting an NFT using the Warpcast Wallet.
</Caption>

The SDK exposes an [EIP-1193 Ethereum Provider
](https://eips.ethereum.org/EIPS/eip-1193) at `sdk.wallet.ethProvider`. You can
interact with this object directly or use it with ecosystem tools like
[Wagmi](https://wagmi.sh/) or [Ethers](https://docs.ethers.org/v6/).

For more information:

* [EIP-1193 Ethereum Provider API](https://eips.ethereum.org/EIPS/eip-1193)
* [Guide on interacting with wallets](/docs/guides/wallets)


import { Caption } from '../../../components/Caption';

## addFrame

Prompts the user to add the app.

![adding a mini app in Warpcast](/add_frame_preview.png)

<Caption>
  A users discover an app from their social feed, adds it, and then sees it
  from their apps screen
</Caption>

### Usage

```ts twoslash
import { sdk } from '@farcaster/frame-sdk'

await sdk.actions.addFrame()
```

### Return Value

`void`

### Errors

#### `RejectedByUser`

Thrown if a user rejects the request to add the Mini App.

#### `InvalidDomainManifestJson`

Thrown an app does not have a valid `farcaster.json`.


import { Caption } from '../../../components/Caption';

## close

Closes the mini app.

![closing the app](/close_preview.png)

<Caption>
  Close the app with `close`.
</Caption>

### Usage

```ts twoslash
import { sdk } from '@farcaster/frame-sdk'

await sdk.actions.close()
```

### Return Value

`void`


import { Caption } from '../../../components/Caption';

## openUrl

Opens an external URL.

If a user is on mobile `openUrl` can be used to deeplink
users into different parts of the Farcaster client they
are using.

![opening a url](/open_url_preview.png)

<Caption>
  Opening an external url with `openUrl`.
</Caption>

### Usage

```ts twoslash
const url = 'https://farcaster.xyz';

//---cut---
import { sdk } from '@farcaster/frame-sdk'

await sdk.actions.openUrl(url)
```

### Return Value

\`void


import { Caption } from '../../../components/Caption';

## ready

Hides the Splash Screen. Read the [guide on loading your app](/docs/guides/loading) for best practices.

![calling ready to hide the splash screen](/ready_preview.png)

<Caption>
  Dismiss the Splash Screen with ready.
</Caption>

### Usage

```ts twoslash
import { sdk } from '@farcaster/frame-sdk'

await sdk.actions.ready()
```

### Parameters

#### disableNativeGestures (optional)

* **Type:** `boolean`
* **Default:** `false`

Disable native gestures. Use this option if your frame uses gestures
that conflict with native gestures like swipe to dismiss.

### Return Value

`void`


import { Caption } from '../../../components/Caption';

## signIn

Request a [Sign in with Farcaster
(SIWF)](https://docs.farcaster.xyz/developers/siwf/) credential from the user.

See the guide on [authenticating users](/docs/guides/auth).

![signing in a user](/sign_in_preview.png)

<Caption>
  A users opens an app and is automatically signed in
</Caption>

### Usage

```ts twoslash
/**
 * Cryptographically secure nonce generated on the server and associated with
 * the user's session.
 */ 
const nonce = 'securenonce';

// ---cut---
import { sdk } from '@farcaster/frame-sdk'

await sdk.actions.signIn({ 
  nonce 
})
```

### Parameters

#### nonce

* **Type:** `string`

A random string used to prevent replay attacks, at least 8 alphanumeric
characters.

### Return Value

The SIWF message and signature.

```
type SignInResult = {
  signature: string;
  message: string;
}
```

:::note
This message must be sent to your server and verified. See the guide on
[authenticating with Farcaster](/docs/guides/loading) for more information.
:::


import { Caption } from '../../../components/Caption';

## viewProfile

Displays a user's Farcaster profile.

![viewing a profile from an app](/view_profile_preview.png)

<Caption>
  Viewing a profile and follow a user from an app.
</Caption>

### Usage

```ts twoslash
const fid = 6841;

// ---cut---
import { sdk } from '@farcaster/frame-sdk'

await sdk.actions.viewProfile({ 
  fid
})
```

### Parameters

#### fid

* **Type:** `number`

Farcaster ID of the user who's profile to view.

### Return Value

`void`


import { Caption } from '../../../components/Caption';

## Authenticating users

An app can use the [signIn](/docs/actions/sign-in) to get a [Sign in with
Farcaster (SIWF)](https://docs.farcaster.xyz/developers/siwf/) authentication credential for the user.

After requesting the credential, applications can verify it on their server
using
[verifySignInMessage](https://docs.farcaster.xyz/auth-kit/client/app/verify-sign-in-message).
Apps can then issue a session token like a JWT that can be used for the
remainder of the session.

Session tokens should be kept in memory but not persisted in Local Storage or
Cookies. Since users are signing in through their Farcaster client their
expectation will be if they sign out of the their Farcaster client they'll be
signed out of any Mini Apps as well.

### User Experience

In cases where the Farcaster client (i.e. on mobile) has direct access to the
user's signing key (e.g. their custody account) this credential can be produced
silently without the user needing to take any action. Otherwise the user will be
prompted to sign in.

Farcaster clients are working to support silent sign-in across all platforms so
that users are never prompted to sign in on a different device.

![signing in a user](/sign_in_preview.png)

<Caption>
  A users opens an app and is automatically signed in
</Caption>


import { Caption } from '../../../components/Caption';

## Loading your app

When users open Mini Apps in Farcaster they are shown a branded splash screen
instead of a blank loading page like they would in a browser. Once your interface
is ready to show the splash screen can be hidden.

![calling ready to hide the splash screen](/ready_preview.png)

<Caption>
  Dismiss the Splash Screen with ready.
</Caption>

### Calling ready

Call [ready](/docs/actions/ready) when your interface is ready to be displayed:

```ts twoslash
import { sdk } from '@farcaster/frame-sdk'

await sdk.actions.ready();
```

**You should call ready as soon as possible while avoiding jitter and content
reflows.**

Minimize loading time for your app by following web performance best practices:

* [Learn about web performance](https://web.dev/learn/performance)
* [Test your app's speed and diagnose performance issues](https://pagespeed.web.dev/analysis/https-pagespeed-web-dev/bywca5kqd1?form_factor=mobile)

<br />

To avoid jitter and content reflowing:

* Don't call ready until your interface has loaded
* Use placeholders and skeleton states if additional loading is required

#### Disabling native gestures

Mini Apps are rendered in modal elements where certain swipe gestures or clicks
outside the app surface will result in the app closing. If your app has conflicting
gestures you can set the `disableNativeGestures` flag to disable native gestures.

```ts
await sdk.actions.ready({ disableNativeGestures: true });
```

### Splash Screen

When a user launches your app they will see a Splash Screen while your app loads.

![splash screen schematic](/splash_screen_schematic.png)

You'll learn how to configure the Splash Screen in the [sharing your
app](/docs/guides/sharing) and [publishing your app](/docs/guides/publishing)
guides.

### Previewing your app

This app doesn't do anything interesting yet but we've now done the bare
minimum to preview it inside a Farcaster client.

Let's preview it in Warpcast:

1. Open the [Mini App Debug Tool](https://warpcast.com/~/developers/mini-apps/debug)
   on desktop
2. Enter your app url
3. Hit *Preview*


import { Caption } from '../../../components/Caption';

## Sending Notifications

Mini Apps can send notifications to users who have added the Mini App to
their Farcaster client and enabled notifications.

![in-app notifications in Warpcast](/in-app-notifications-preview.png)

<Caption>
  An in-app notification is sent to a user and launches them into the app
</Caption>

### Overview

At a high-level notifications work like so:

* when a user enables notifications for your app, the Farcaster client (i.e. Warpcast)
  hosting your app will generate a notification token for that user and send it
  to your server
* to send a notification to a user, make a request to host's servers with the
  notification token and content
* if a user later disables notifications, you'll receive another event indicating
  the user is unsubscribed and the notification token is no longer valid

### Steps

::::steps
#### Listen for events

You'll need a server to receive webhook events and a database to store
notification tokens for users:

* **Managed** - If you'd rather stay focused on your app, use
  [Neynar](https://neynar.com) to manage notification tokens on your behalf:<br />
  [Setup a managed notifications server with
  Neynar](https://docs.neynar.com/docs/send-notifications-to-frame-users#step-1-add-events-webhook-url-to-frame-manifest).
* **Roll your own** - If you want to host your own server to receive webhooks:<br />
  [Follow the Receiving Webhooks guide](#receiving-webhooks).

#### Add your webhook URL in `farcaster.json`

If you haven't already, follow the [Publishing your app](/docs/guides/publishing) guide to host a
`farcaster.json` on your app's domain.

Define the `webhookUrl` property in your app's configuration in `farcaster.json`:

```json
{
  "accountAssociation": {
    "header": "eyJmaWQiOjU0NDgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHg2MWQwMEFENzYwNjhGOEQ0NzQwYzM1OEM4QzAzYUFFYjUxMGI1OTBEIn0",
    "payload": "eyJkb21haW4iOiJleGFtcGxlLmNvbSJ9",
    "signature": "MHg3NmRkOWVlMjE4OGEyMjliNzExZjUzOTkxYTc1NmEzMGZjNTA3NmE5OTU5OWJmOWFmYjYyMzAyZWQxMWQ2MWFmNTExYzlhYWVjNjQ3OWMzODcyMTI5MzA2YmJhYjdhMTE0MmRhMjA4MmNjNTM5MTJiY2MyMDRhMWFjZTY2NjE5OTFj"
  },
  "frame": {
    "version": "1",
    "name": "Example App",
    "iconUrl": "https://example.com/icon.png",
    "homeUrl": "https://example.com",
    "imageUrl": "https://example.com/image.png",
    "buttonTitle": "Check this out",
    "splashImageUrl": "https://example.com/splash.png",
    "splashBackgroundColor": "#eeccff",
    "webhookUrl": "https://example.com/api/webhook" // [!code focus] 
  }
}
```

:::note
For a real example, this is Yoink's manifest:
[https://yoink.party/.well-known/farcaster.json](https://yoink.party/.well-known/farcaster.json)
:::

#### Get users to add your app

For a Mini App to send notifications, it needs to first be added by a user to
their Farcaster client and for notifications to be enabled (these will be
enabled by default).

Use the [addFrame](/docs/actions/add-frame) action while a user is using your app to prompt
them to add it:

#### Save the notification tokens

When notifications are enabled, the Farcaster client generates a unique
notification token for the user. This token is sent webhook endpoint along with
a `url` that the app should call to send a notification.

The `token` and `url` need to be securely saved to database so they can be
looked up when you want to send a notification to a particular user.

#### Send a notification

Once you have a notification token for a user, you can send them a notification
by sending a `POST` request the `url` associated with that token.

![notifications schematic](/notification_schematic.png)

[Example code to send a
notification](https://github.com/farcasterxyz/frames-v2-demo/blob/7905a24b7cd254a77a7e1a541288379b444bc23e/src/app/api/send-notification/route.ts#L25-L65)

Here are the types:

```ts
export const sendNotificationRequestSchema = z.object({
  notificationId: z.string().max(128),
  title: z.string().max(32),
  body: z.string().max(128),
  targetUrl: z.string().max(256),
  tokens: z.string().array().max(100),
});
export type SendNotificationRequest = z.infer<
  typeof sendNotificationRequestSchema
>;

export const sendNotificationResponseSchema = z.object({
  result: z.object({
    successfulTokens: z.array(z.string()),
    invalidTokens: z.array(z.string()),
    rateLimitedTokens: z.array(z.string()),
  }),
});
export type SendNotificationResponse = z.infer<
  typeof sendNotificationResponseSchema
>;
```

The request is a JSON consisting of:

* `notificationId`: a string (max size 128) that serves as an idempotency key
  and will be passed back to the app via context. A Farcaster client should
  deliver only one notification per user per `notificationId`, even if called
  multiple times.
* `title`: title of the notification, max 32 characters
* `body`: body of the notification, max 128 characters
* `targetUrl`: the target app URL to open when a user clicks the
  notification. It must match the domain for which the notification token was
  issued. Max 256 characters.
* `tokens`: an array of tokens (for that `url`) to send the notification to.
  Max 100 per call.

Note that client servers may impose rate limits per `token`. Warpcast enforces the following rate limits:

* 1 notification per 30 seconds per `token`
* 100 notifications per day per `token`

The response from the client server must be an HTTP 200 OK, with a `result` object that contains 3 arrays:

* `successfulTokens`: tokens for which the notification succeeded, including
  those for which the request is a duplicate (same `notificationId` used before)
* `invalidTokens`: tokens which are no longer valid and should never be used
  again. This could happen if the user disabled notifications.
* `rateLimitedTokens`: tokens for which the rate limit was exceeded. You can try later.

Once a user clicks the notification, the Farcaster client will:

* Open `targetUrl`
* Set the `context.location` to a `FrameLocationNotificationContext`

```ts
export type FrameLocationNotificationContext = {
  type: 'notification';
  notification: {
    notificationId: string;
    title: string;
    body: string;
  };
};
```
::::

### Receiving webhooks

Users can add and configure notification settings Mini Apps within their
Farcaster client. When this happens Farcaster clients will send events your
server that include data relevant to the event.

This allows your app to:

* keep track of what users have added or removed your app
* securely receive tokens that can be used to send notifications to your users

:::note
If you'd rather stay focused on your app, [Neynar](https://neynar.com) offers a
[managed service to handle
webhooks](https://docs.neynar.com/docs/send-notifications-to-frame-users#step-1-add-events-webhook-url-to-frame-manifest)
on behalf of your application.
:::

#### Events

##### frame\_added

Sent when the user adds the Mini App to their Farcaster client (whether or not
this was triggered by an `addFrame()` prompt).

The optional `notificationDetails` object provides the `token` and `url` if the
client equates adding to enabling notifications (Warpcast does this).

##### Payload

```json
{
  "event": "frame_added",
  "notificationDetails": {
    "url": "https://api.warpcast.com/v1/frame-notifications",
    "token": "a05059ef2415c67b08ecceb539201cbc6"
  }
}
```

##### frame\_removed

Sent when a user removes a mini app, which means that any notification tokens for
that fid and client app (based on signer requester) should be considered
invalid:

##### Payload

```json
{
  "event": "frame_removed"
}
```

##### notifications\_disabled

Sent when a user disables notifications from e.g. a settings panel in the
client app. Any notification tokens for that fid and client app (based on
signer requester) should be considered invalid:

##### Payload

```json
{
  "event": "notifications_disabled"
}
```

##### notifications\_enabled

Sent when a user enables notifications (e.g. after disabling them). The payload
includes a new `token` and `url`:

##### Payload

```json
{
  "event": "notifications_enabled",
  "notificationDetails": {
    "url": "https://api.warpcast.com/v1/frame-notifications",
    "token": "a05059ef2415c67b08ecceb539201cbc6"
  }
}
```

#### Handling events

Farcaster clients will POST events to the `webhookUrl` specified in your `farcaster.json`.

Your endpoint should:

* verify the event
* persist relevant data
* return a 200 response

If your app doesn't respond with a 200, the Farcaster client will attempt to
re-send the event. The exact number of retries is up to each client.

#### Verifying events

Events are signed by the app key of a user with a [JSON Farcaster
Signature](https://github.com/farcasterxyz/protocol/discussions/208). This allows
Mini Apps to verify the Farcaster client that generated the notification and the
Farcaster user they generated it for.

The
[`@farcaster/frame-node`](https://github.com/farcasterxyz/frames/tree/main/packages/frame-node)
library provides a helper for verifying events. To use it, you'll need to supply a validation
function that can check the signatures against the latest Farcaster network state.

An implementation that uses [Neynar](https://neynar.com) is provided. You can sign up and get
an API key on their free tier. Make sure to set `NEYNAR_API_KEY` environment variable.

#### Example

```ts twoslash
const requestJson = "base64encodeddata";

// ---cut---
import {
  ParseWebhookEvent,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/frame-node";

try {
  const data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
} catch (e: unknown) {
  const error = e as ParseWebhookEvent.ErrorType;

  switch (error.name) {
    case "VerifyJsonFarcasterSignature.InvalidDataError":
    case "VerifyJsonFarcasterSignature.InvalidEventDataError":
      // The request data is invalid
    case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
      // The app key is invalid
    case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
      // Internal error verifying the app key (caller may want to try again)
  }
}
```

#### Reference implementation

For a complete example, check out the [Mini App V2 Demo
](https://github.com/farcasterxyz/frames-v2-demo) has all of the above:

* [Handles webhooks](https://github.com/farcasterxyz/frames-v2-demo/blob/main/src/app/api/webhook/route.ts) leveraging the [`@farcaster/frame-node`](https://github.com/farcasterxyz/frames/tree/main/packages/frame-node) library that makes this very easy
* [Saves notification tokens to Redis](https://github.com/farcasterxyz/frames-v2-demo/blob/main/src/lib/kv.ts)
* [Sends notifications](https://github.com/farcasterxyz/frames-v2-demo/blob/main/src/lib/notifs.ts)


import { Caption } from '../../../components/Caption';

## Publishing your app

Publishing Mini Apps involves providing information like who developed the app,
how it should be displayed, and what its capabilities are.

Since Farcaster is a decentralized network with multiple clients, publishing is
done by hosting a file at `/.well-known/farcaster.json` on the domain your app
is hosted on rather than submitting information directly to single entity.

![discover mini apps](/explore-preview.png)

<Caption>
  Published Mini Apps can be discovered in App Stores.
</Caption>

### Choosing a domain

A Mini App is associated with a single domain (i.e. rewards.warpcast.com). This
domain serves as the identifier for your app and can't be changed later so
you'll should choose a stable domain. There's no limit on the number of apps
you can create, so you can optionally use a separate domain for development.

:::note
A domain does not include the scheme (e.g. https) or path. It can optionally
include a subdomain.

* ✅ rewards.warpcast.com
* ❌ [https://rewards.warpcast.com](https://rewards.warpcast.com)
:::

### Verifying ownership

A Mini App is owned by a single Farcaster account. This lets users know who
they are interacting with and developers get credit for their work.

:::tip
Verified Mini Apps are automatically eligible for [Warpcast Developer
Rewards](https://warpcast.com/~/mini-apps/rewards) that are paid out weekly
based on usage and onchain transactions.
:::

![verified author ](/verified_author.png)

Verification is done by placing a cryptographically signed message in your
`farcaster.json` file that associates the domain with a Farcaster account.

We'll generate this verification below.

### App Profile

A Mini App has metadata that is used by Farcaster clients to host your apps.
This data is also provided in `farcaster.json`.

### Generating `farcaster.json`

You can generate both the verification and profile compoents of this file
including the signature using the [Farcaster JSON
Tool](https://warpcast.com/~/developers/new) in Warpcast.

Take the generated file and host it on your domain at
`/.well-known/farcaster.json`.

:::warning
The domain you host the file on must exactly match the domain you entered in
the Warpcast tool.
:::


import { Caption } from '../../../components/Caption';

## Sharing your app

Mini Apps can be shared in social feeds using special embeds that let users
interact with an app directly from their feed.

Each URL in your application can be made embeddable by adding meta tags to it
that specify an image and action, similar to how Open Graph tags work.

For example:

* a personality quiz app can let users share a personalized embed with their results
* an NFT marketplace can let users share an embed for each listing
* a prediction market app can let users share an embed for each market

![sharing an app in a social feed with a embed](/share_frame_preview.png)

<Caption>
  A viral loop: user discovers app in feed → uses app → shares app in feed
</Caption>

### Sharing a page in your app

Add a meta tag in the `<head>` section of the page you want to make
sharable specifying the embed metadata:

```html
<meta name="fc:frame" content="<stringified FrameEmbed JSON>" />
```

When a user shares the URL with your embed on it in a Farcaster client, the
Farcaster client will fetch the HTML, see the `fc:frame` meta tag, and use it
to render a rich card.

### Properties

![frame schematic](/frame-schematic.png)

#### `version`

The string literal `'next'`.

#### `imageUrl`

The URL of the image that should be displayed.

* the image will be displayed at 3:2 aspect ratio.
* the image must be less than 10MB
* The URL must be \<= 512 characters

#### `button.title`

This text will be rendered in the button. Use a clear call-to-action that hints
to the user what action they can take in your app.

#### `button.action.type`

The string literal `'launch_frame'`.

#### `button.action.url`

The URL that the user will be sent to within your app.

#### `button.action.name` (optional)

Name of the application. Defaults to name of your application in `farcaster.json`.

#### `button.action.splashImageUrl` (optional)

Splash image URL. Defaults to `splashImageUrl` specified in your application's `farcaster.json`.

#### `button.action.splashBackgroundColor` (optional)

Splash image Color. Defaults to `splashBackgroundColor` specified in your application's `farcaster.json`.

### Example

```typescript
const frame = {
  version: "next",
  imageUrl: "https://yoink.party/framesV2/opengraph-image",
  button: {
    title: "🚩 Start",
    action: {
      type: "launch_frame",
      url: "https://yoink.party/framesV2",
      name:"Yoink!",
      splashImageUrl: "https://yoink.party/logo.png",
      splashBackgroundColor:"#f5f0ec"
    }
  }
}
```

```html
<html lang="en">
  <head>
    <!-- head content -->
    <meta name="fc:frame" content='{"version":"next","imageUrl":"https://yoink.party/framesV2/opengraph-image","button":{"title":"🚩 Start","action":{"type":"launch_frame","name":"Yoink!","url":"https://yoink.party/framesV2","splashImageUrl":"https://yoink.party/logo.png","splashBackgroundColor":"#f5f0ec"}}}' />
  </head>
  <body>
    <!-- page content -->
  </body>
</html>
```

### Debugging

You can use the [Embed Debug Tool](https://warpcast.com/~/developers/mini-apps/embed) in Warpcast to preview a embed.

:::note
If you are using localhost, you'll need to make your server publicly accessible (e.g., using a tool like ngrok) for the debug tool to access your embed.
:::

### Caching

Since embeds are shared in feeds, they are generally scraped once and cached so
that they can be efficiently served in the feeds of hundreds or thousands
users.

This means that when a URL gets shared, the embed data present at that time
will be attached to the cast and won't be updated even if the embed data at
that URL gets changed.

#### Lifecycle

1. App adds an `fc:frame` meta tag to a page to make it sharable.
2. User copies URL and embeds it in a cast.
3. Farcaster client fetches the URL and attaches the frame metadata to the cast.
4. Farcaster client injects the cast + embed + attached metadata into thousands of feeds.
5. User sees cast in feed with an embed rendered from the attached metadata.

### Next steps

Now that you know how to create embeds for your app, think about how you'll get
users to share them in feed. For instance, you can create a call-to-action once
a user takes an action in your app to share a embed in a cast.

At the very least you'll want to setup a embed for the root URL of your application.

### Advanced Topics

#### Dynamic Embed images

Even though the  data attached to a specific cast is static, a dynamic
image can be served using tools like Next.js
[Next ImageResponse](https://nextjs.org/docs/app/api-reference/functions/image-response).

For example, we could create an embed that shows the current price of ETH. We'd
set the `imageUrl` to a static URL like `https://example.xyz/eth-price.png`. When a request
is made to this endpoint we'd:

* fetch the latest price of ETH (ideally from a cache)
* renders an image using a tool like [Vercel
  OG](https://vercel.com/docs/functions/og-image-generation) and returns it
* sets the following header: `Cache-Control: public, immutable, no-transform,
  max-age=300`

##### Setting `max-age`

You should always set a non-zero `max-age` (outside of testing) so that the
image can get cached and served from CDNs, otherwise users will see a gray
image in their feed while the dynamic image is generated. You'll also quickly
rack up a huge bill from your servie provider. The exact time depends on your
application but opt for the longest time that still keeps the image reasonably
fresh. If you're needing freshness less than a minute you should reconsider
your design or be prepared to operate a high-performance endpoint.

Here's some more reading if you're interested in doing this:

* [Vercel Blog - Fast, dynamic social card images at the Edge](https://vercel.com/blog/introducing-vercel-og-image-generation-fast-dynamic-social-card-images)
* [Vercel Docs - OG Image Generation](https://vercel.com/docs/og-image-generation)

##### Avoid caching fallback images

If you are generating a dynamic images there's a chance something goes wrong when
generating the image (for instance, the price of ETH is not available) and you need
to serve a fallback image.

In this case you should use an extremely short or even 0 `max-age` to prevent the
error image from getting stuck in any upstream CDNs.


import { Caption } from '../../../components/Caption';

## Interacting with Wallets

Mini Apps can interact with a user's crypto wallet without needing to worry
about popping open "select your wallet" dialogs or flakey connections.

![users taking onchain action from app](/transaction-preview.png)

<Caption>
  A user minting an NFT using the Warpcast Wallet.
</Caption>

### Getting Started

The Mini App SDK exposes an [EIP-1193 Ethereum Provider
API](https://eips.ethereum.org/EIPS/eip-1193) at `sdk.wallet.ethProvider`.

We recommend using [Wagmi](https://wagmi.sh) to connect to and interact with
the users wallet. This is not required but provides high-level hooks for
interacting with the wallet in a type-safe way.

::::steps
#### Setup Wagmi

Use the [Getting Started
guide](https://wagmi.sh/react/getting-started#manual-installation) to setup
Wagmi in your project.

#### Install the connector

Next we'll install a Wagmi connector that will be used to interact with the
user's wallet:

:::code-group
```bash [npm]
npm install @farcaster/frame-wagmi-connector
```

```bash [pnpm]
pnpm add @farcaster/frame-wagmi-connector
```

```bash [yarn]
yarn add @farcaster/frame-wagmi-connector
```
:::

#### Add to Wagmi configuration

Add the Mini App connector to your Wagmi config:

```ts
import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector'

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [
    miniAppConnector()
  ]
})
```

#### Connect to the wallet

If a user already has a connected wallet the connector will automatically
connect to it (e.g. `isConnected` will be true).

It's possible a user doesn't have a connected wallet so you should always check
for a connection and prompt them to connect if they aren't already connected:

```tsx
import { useAccount, useConnect } from 'wagmi'

function ConnectMenu() {
  const { isConnected, address } = useAccount()
  const { connect, connectors } = useConnect()

  if (isConnected) {
    return (
      <>
        <div>You're connected!
        <div>Address: {address}</div>
      </>
    )
  }

  return (
    <button
      type="button"
      onClick={() => connect({ connector: connectors[0] })}
    >
      Connect
    </button>
  )
}
```

:::note
Your Mini App won't need to show a wallet selection dialog that is common in a
web based dapp, the Farcaster client hosting your app will take care of getting
the user connected to their preferred crypto wallet.
:::

#### Send a transaction

You're now ready to prompt the user to transact. They will be shown a preview
of the transaction in their wallet and asked to confirm it:

Follow [this guide from
Wagmi](https://wagmi.sh/react/guides/send-transaction#_2-create-a-new-component)
on sending a transaction (note: skip step 1 since you're already connected to
the user's wallet).
::::

### Troubleshooting

#### Transaction Scanning

Modern crypto wallets scan transactions and preview them to users to help
protect users from scams. New contracts and applications can generate false
positives in these systems. If your transaction is being reported as
potentially malicious use this [Blockaid
Tool](https://report.blockaid.io/verifiedProject) to verify your app with
Blockaid.
