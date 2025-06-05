# MadoHomu.love | haojiezhe12345.github.io (Vue 3)

Pure frontend code for http://madohomu.love  
No media or images included. Resources are loaded from https://haojiezhe12345.top:82/madohomu/

**Migrating to Vue 3. Lots of components are still in Vanilla JS**

## Building

- To build for servers with media resources and API backend running:
  ```
  npm run build
  ```

- To build for servers serving HTML, CSS & JS assets only:
  ```
  npm run build:transform-api-endpoint
  ```  
  This sets https://haojiezhe12345.top:82/madohomu/ as the base URL for API and resources  
  so that it uses official MadoHomu.love server

### Customizing the URL base

The script at [scripts/transform_dist_api_endpoint.py](scripts/transform_dist_api_endpoint.py) replaces relative URLs with absolute in `dist/index*`  
It accepts `base URL` as first parameter should be run in `scripts/` after `npm run build`

Build the project first:
```
npm run build
```

Change directory:
```
cd scripts
```

Then replace the URLs:
```
python transform_dist_api_endpoint.py <base_url>
```
If you don't provide `<base_url>`, it defaults to `https://haojiezhe12345.top:82/madohomu/`


## Links

Backend: [MadoHomuAPI](https://github.com/haojiezhe12345/MadoHomuAPI)

Full website backup: https://1drv.ms/f/s!AhBOA0l_B26M51sTobCapRxkqXoS
