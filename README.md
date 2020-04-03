# simple-file-manager

This is a simple file manager for personal usage, it's just like some other file manager as the followings:

- https://github.com/OpusCapita/filemanager, https://demo.core.dev.opuscapita.com/filemanager/master/?currentComponentName=FileManager&maxContainerWidth=100%25&showSidebar=false
- https://github.com/alexusmai/vue-laravel-file-manager
- https://github.com/talented/FileManager
- ...

But it's build from scratch using ant-design-vue and vue-context. You can preview its appearence on https://liudonghua123.github.io/simple-file-manager/ 

## How to use it

1. yarn add simple-file-manager
2. use the component like this

   ```js
    import SimpleFileManager from "simple-file-manager";
    // register SimpleFileManager component in components of vue
    // add the following in template
    <simple-file-manager
      :uploadEnable="uploadEnable"
      :showFilesInNavigationTree="showFilesInNavigationTree"
      :showFilesInContentView="showFilesInContentView"
      @fileOperation="handleFileOperation"
    />
   ```

see more details in example.

## License

MIT License

Copyright (c) 2020 liudonghua