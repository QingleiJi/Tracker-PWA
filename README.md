# Tracker PWA

This is a simple yet powerful Progressive Web App (PWA) to track anything you want. It's built with React, Ionic, and Vite, and it stores all data locally on your device using IndexedDB.

## Live App

The app is hosted at: [www.qinglei.tech/tracker](https://www.qinglei.tech/tracker)

Being a PWA, you can "install" it on your mobile or desktop device for a native-app-like experience.

## How to Use the App

1.  **Add a Measurement Type**: First, create a category for what you want to track. This could be anything from "Weight" (in kg) to "Books Read" (as a unit) or "Mood" (on a scale of 1-10).
2.  **Log Entries**: Once you have a measurement type, you can start adding entries. For example, you can log your weight every day, the number of pages you read, or your mood at different times.
3.  **Visualize Your Progress**: The app provides charts to help you visualize the data you've logged over time, making it easy to see trends and track your progress.

## Features

-   **Works Offline**: All your data is stored in your browser, so the app works even without an internet connection.
-   **Private**: Your data stays on your device and is not sent to any server.
-   **Installable**: As a PWA, you can add it to your home screen on mobile or install it as a desktop app.
-   **Data Portability**: Easily upload and download your data. This allows you to transfer your tracking history between different devices, ensuring you have your data wherever you go.
-   **Data Visualization**: See your progress with charts.
-   **Customizable**: Track anything you can imagine by defining your own measurement types.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js and npm (or your favorite package manager).

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/qingleiji/Tracker-PWA.git
    ```
2.  Navigate to the project directory
    ```sh
    cd Tracker-PWA
    ```
3.  Install NPM packages
    ```sh
    npm install
    ```

### Development

To run the app in development mode:

```sh
npm run dev
```

This will open a local development server.

### Build

To build the app for production:

```sh
npm run build
```

This will create a `dist` folder with the optimized production build of the app.

## Tech Stack

-   [React](https://reactjs.org/)
-   [Vite](https://vitejs.dev/)
-   [Ionic](https://ionicframework.com/docs/react)
-   [TypeScript](https://www.typescriptlang.org/)
-   [Dexie.js](https://dexie.org/) (for IndexedDB)
-   [Recharts](https://recharts.org/)
