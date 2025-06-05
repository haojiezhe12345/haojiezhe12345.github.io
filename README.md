# MadoHomu.love | haojiezhe12345.github.io (Vue 3)

Pure frontend code for http://madohomu.love  
No media or images included. Resources are loaded from https://haojiezhe12345.top:82/madohomu/

Moving to Vue 3, lots of components are still in Vanilla JS / Vue 2 (located at `/public`)

## Building

- To build for local server (use API & resources from your own server):  
  ```
  npm run build
  ```

- To build for servers serving CSS & JS assets only:  
  ```
  npm run build:transform-api-endpoint
  ```  
  This sets https://haojiezhe12345.top:82/madohomu/ as base URL for API and resources endpoints  
  so that it uses official MadoHomu.love server

### Backend: [MadoHomuAPI](https://github.com/haojiezhe12345/MadoHomuAPI)

### Full website backup: https://1drv.ms/f/s!AhBOA0l_B26M51sTobCapRxkqXoS
