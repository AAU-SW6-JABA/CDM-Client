# CDM-Client

A tool for inspecting the data gathered by the CDM server: https://github.com/AAU-SW6-JABA/CDM-Server

## Submodules

This project uses the submodule at https://github.com/AAU-SW6-JABA/CDM-ProtocolBuffer

## Setup

To initialize the project run the setup script which installs dependencies and generates gRPC types:

```
yarn setup
```

## Usage

The project can be run in two different ways, namely using either the `yarn dev` or `yarn start` script. The dev script is mainly meant for use in development environments as it hot-reloads the server upon save of any file.

A URL should be printed in the terminal, looking something like `http://localhost:5173/`. Open it in a browser to access the client UI.
