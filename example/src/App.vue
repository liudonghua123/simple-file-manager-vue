<template>
  <div id="app">
    <a-card title="simple-file-manager-vue component">
      <a-form layout="inline">
        <a-form-item label="Settings: " />
        <a-form-item label="uploadEnable">
          <a-switch v-model="uploadEnable">
            <a-icon type="check" slot="checkedChildren" />
            <a-icon type="close" slot="unCheckedChildren" />
          </a-switch>
        </a-form-item>
        <a-form-item label="showFilesInNavigationTree">
          <a-switch v-model="showFilesInNavigationTree">
            <a-icon type="check" slot="checkedChildren" />
            <a-icon type="close" slot="unCheckedChildren" />
          </a-switch>
        </a-form-item>
        <a-form-item label="showFilesInContentView">
          <a-switch v-model="showFilesInContentView">
            <a-icon type="check" slot="checkedChildren" />
            <a-icon type="close" slot="unCheckedChildren" />
          </a-switch>
        </a-form-item>
        <a-form-item label="data">
          <a-button type="primary" @click="showDataEditor">Data Editor</a-button>
        </a-form-item>
      </a-form>
      <simple-file-manager
        :files="files"
        :uploadEnable="uploadEnable"
        :showFilesInNavigationTree="showFilesInNavigationTree"
        :showFilesInContentView="showFilesInContentView"
        @fileOperation="handleFileOperation"
      />
    </a-card>
    <a-modal title="Data Editor" v-model="visible" @ok="handleOk" :width="960">
      <MonacoEditor class="editor" v-model="data" language="json" />
    </a-modal>
  </div>
</template>

<script>
import SimpleFileManager from "simple-file-manager-vue";
import MonacoEditor from "vue-monaco";
import moment from "moment";
import data from "./sample-data";
import "simple-file-manager-vue/dist/simple-file-manager-vue.css";

export default {
  name: "app",
  components: {
    SimpleFileManager,
    MonacoEditor
  },
  data() {
    return {
      files: data,
      uploadEnable: false,
      showFilesInNavigationTree: false,
      showFilesInContentView: false,
      visible: false,
      data: null
    };
  },
  methods: {
    showDataEditor(event) {
      this.data = JSON.stringify(this.files, null, 2);
      this.visible = true;
    },
    handleOk(e) {
      this.files = JSON.parse(this.data);
      this.visible = false;
    },
    findFilesNode(currentLocation, files) {
      let currentNode = null;
      let parentNode = files;
      for (const currentLabel of currentLocation) {
        for (let i = 0; i < parentNode.length; i++) {
          if (parentNode[i].fileName == currentLabel) {
            currentNode = parentNode[i];
            parentNode = parentNode[i].children;
            break;
          }
        }
      }
      return { currentNode };
    },
    handleFileOperation(evt, { type, ...extras }) {
      console.info(`handleFileOperation, type: ${type}, extra: `, extras);
      const files = JSON.parse(JSON.stringify(this.files));
      evt.waitUntil(
        new Promise((resolve, reject) => {
          switch (type) {
            case "createDirectory": {
              const { createDirectoryName, currentLocation } = extras;
              const { currentNode } = this.findFilesNode(
                currentLocation,
                files
              );
              if (!currentNode.children) {
                currentNode.children = [];
              }
              currentNode.children.push({
                fileName: createDirectoryName,
                children: []
              });
              break;
            }
            case "upload": {
              const { formData, currentLocation } = extras;
              const { currentNode } = this.findFilesNode(
                currentLocation,
                files
              );
              if (!currentNode.children) {
                currentNode.children = [];
              }
              extras.formData
                .getAll("files[]")
                .map(item => ({
                  fileName: item.name,
                  fileSize: item.size,
                  lastModifiedTime: moment
                    .utc(item.lastModified)
                    .utcOffset(480)
                    .format("YYYY-MM-DD hh:mm:ss")
                }))
                .forEach(item => currentNode.children.push(item));
              break;
            }
            case "rename": {
              const { fileName, renameFileName, currentLocation } = extras;
              const { currentNode } = this.findFilesNode(
                currentLocation,
                files
              );
              currentNode.children.filter(
                item => item.fileName == fileName
              )[0].fileName = renameFileName;
              break;
            }
            case "remove": {
              const { fileName, currentLocation } = extras;
              const { currentNode } = this.findFilesNode(
                currentLocation,
                files
              );
              currentNode.children = currentNode.children.filter(
                item => item.fileName != fileName
              );
              break;
            }
          }
          console.info(`new files: ${JSON.stringify(this.files, null, 2)}`);
          setTimeout(() => {
            this.files = files;
            console.info(`resolved`);
            resolve("resolved");
          }, 500);
        })
      );
    }
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.editor {
  width: 900px;
  height: 400px;
}
</style>
