<template>
  <a-layout class="file-manager">
    <a-layout-sider
      theme="light"
      class="file-manager-sider"
      collapsedWidth="50"
      collapsible
      v-model="collapsed"
    >
      <a-directory-tree
        :defaultSelectedKeys="defaultSelectedKeys"
        :selectedKeys="selectedKeys"
        :expandedKeys="expandedKeys"
        expandAction="dblclick"
        :treeData="treeData"
        @select="onSelect"
        @expand="onExpand"
      ></a-directory-tree>
    </a-layout-sider>

    <a-layout class="file-manager-content">
      <a-layout-header style="background: #fff;" @contextmenu.prevent.stop>
        <a-button @click="handleCreateDirectory" type="primary" shape="circle">
          <a-icon type="folder-add" :style="{ fontSize: '24px' }" />
        </a-button>
      </a-layout-header>
      <a-layout-content style="margin: 0 16px" @contextmenu.prevent.stop>
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item v-for="item in pathSegments" :key="item">
            <a @click.prevent="changeNavigator(item)">{{ item }}</a>
          </a-breadcrumb-item>
        </a-breadcrumb>
        <div :style="{ padding: '24px', background: '#fff', minHeight: '360px' }">
          <a-upload-dragger
            name="file"
            :multiple="true"
            :fileList="fileList"
            :remove="handleUploadRemove"
            :beforeUpload="beforeUpload"
            v-show="uploadEnable"
          >
            <p class="ant-upload-drag-icon">
              <a-icon type="inbox" />
            </p>
            <p class="ant-upload-text">点击或者拖拽文件到此区域</p>
            <p class="ant-upload-hint">支持批量文件上传.</p>
          </a-upload-dragger>
          <a-button
            type="primary"
            block
            v-show="uploadEnable"
            @click="handleUpload"
            :disabled="fileList.length === 0"
            :loading="uploading"
            style="margin: 16px 0"
          >{{ uploading ? '正在上传' : '开始上传' }}</a-button>

          <vue-context ref="menu">
            <template slot-scope="{data}">
              <li>
                <a
                  menuId="remove"
                  @click.prevent="onContextMenuClick($event, $event.target.getAttribute('menuId'), data)"
                >删除</a>
              </li>
              <li>
                <a
                  menuId="rename"
                  @click.prevent="onContextMenuClick($event, $event.target.getAttribute('menuId'), data)"
                >重命名</a>
              </li>
            </template>
          </vue-context>

          <a-table
            rowKey="fileName"
            :columns="columns"
            :dataSource="dataSource"
            :customRow="customRow"
            :pagination="false"
            :rowSelection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange}"
          >
            <span slot="fileName" slot-scope="fileName">
              <a-icon type="file" />
              {{fileName}}
            </span>
            <span
              slot="fileSize"
              slot-scope="fileSize"
            >{{fileSize ? humanFileSize(fileSize,true): '-'}}</span>
            <span
              slot="lastModifiedTime"
              slot-scope="lastModifiedTime"
            >{{lastModifiedTime ? lastModifiedTime: '-'}}</span>
            <span slot="action" slot-scope="text, record">
              <a-button
                type="primary"
                ghost
                @click="handleRemove($event,'remove',record.fileName)"
              >删除</a-button>
              <a-divider type="vertical" />
              <a-button
                type="primary"
                ghost
                @click="handleRename($event,'rename',record.fileName)"
              >重命名</a-button>
            </span>
          </a-table>
        </div>
      </a-layout-content>
      <a-layout-footer style="text-align: center"></a-layout-footer>
    </a-layout>
  </a-layout>
</template>
<script>
import { VueContext } from "vue-context";

export default {
  components: { VueContext },
  props: {
    files: {
      type: Array,
      default: () => [
        {
          fileName: "Home",
          children: [
            {
              fileName: "section1",
              children: [
                {
                  fileName: "file1.mp4",
                  fileSize: "123456",
                  lastModifiedTime: "2020-04-02 12:12:12"
                },
                {
                  fileName: "file2.mp4",
                  fileSize: "12345",
                  lastModifiedTime: "2020-04-02 11:12:12"
                }
              ]
            }
          ]
        }
      ]
    },
    uploadEnable: {
      type: Boolean,
      default: false
    },
    showFilesInNavigationTree: {
      type: Boolean,
      default: false
    },
    showFilesInContentView: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const treeData = [];
    this.transform(this.files, treeData, this.showFilesInNavigationTree);
    const dataSource = [];
    for (const file of this.files[0].children) {
      if (this.showFilesInContentView || !file.children) {
        dataSource.push(file);
      }
    }
    return {
      collapsed: false,
      treeData,
      defaultSelectedKeys: [treeData[0].title],
      selectedKeys: [treeData[0].title],
      expandedKeys: [treeData[0].title],
      pathSegments: [treeData[0].title],
      dataSource,
      columns: [
        {
          title: "文件名",
          dataIndex: "fileName",
          key: "fileName",
          scopedSlots: { customRender: "fileName" }
        },
        {
          title: "文件大小",
          dataIndex: "fileSize",
          key: "fileSize",
          scopedSlots: { customRender: "fileSize" }
        },
        {
          title: "修改时间",
          dataIndex: "lastModifiedTime",
          key: "lastModifiedTime",
          ellipsis: true,
          scopedSlots: { customRender: "lastModifiedTime" }
        },
        {
          title: "操作",
          key: "action",
          scopedSlots: { customRender: "action" }
        }
      ],

      fileList: [],
      uploading: false,
      renameFileName: {
        validateStatus: "success",
        errorMsg: null
      },
      selectedRowKeys: []
    };
  },
  watch: {
    files: function(newFiles, oldFiles) {
      console.info(`watch files changed`);
      const treeData = [];
      this.transform(this.files, treeData, this.showFilesInNavigationTree);
      this.treeData = treeData;
      const positions = this.getCurrentPositions();
      this.handlePositions(positions);

      this.selectedKeys = [treeData[0].title];
      this.expandedKeys = [treeData[0].title];
    },
    showFilesInNavigationTree: function(newValue, oldValue) {
      console.info(`watch showFilesInNavigationTree changed`);
      const treeData = [];
      this.transform(this.files, treeData, newValue);
      this.treeData = treeData;
    },
    showFilesInContentView: function(newValue, oldValue) {
      console.info(`watch showFilesInContentView changed`);
      const positions = this.getCurrentPositions();
      this.handlePositions(positions);
    }
  },
  methods: {
    customRow(record, index) {
      return {
        on: {
          click: event => {
            console.info(`click record: `, record);
            this.selectedRowKeys = [record.fileName];
          },
          contextmenu: event => {
            event.preventDefault();
            this.$refs.menu.open(event, record);
          }
        }
      };
    },
    onSelectChange(selectedRowKeys) {
      console.info(selectedRowKeys);
      if (selectedRowKeys.length > 1) {
        selectedRowKeys = [selectedRowKeys[selectedRowKeys.length - 1]];
      }
      console.info(selectedRowKeys);
      this.selectedRowKeys = selectedRowKeys;
    },
    handleCreateDirectory(event) {
      const currentLocation = this.getCurrentLocation();
      this.$confirm({
        title: "新建文件夹",
        content: h => (
          <a-form-item
            label="请输入文件夹名"
            validate-status="warning"
            has-feedback
            help="文件夹名中不能包括例如/,@,!等特殊字符"
          >
            <a-input id="createDirectoryName" placeholder="请输入文件夹名" />
          </a-form-item>
        ),
        onOk: async () => {
          let { value: createDirectoryName } = document.getElementById(
            "createDirectoryName"
          );
          createDirectoryName = createDirectoryName.trim();
          console.info(`createDirectoryName: ${createDirectoryName}`);
          if (!createDirectoryName) {
            this.$message.error("文件夹名错误");
            return;
          }
          console.info(`emit rename action`);
          let promise = Promise.resolve();
          event.waitUntil = p => (promise = p);
          try {
            this.$emit("fileOperation", event, {
              type: "createDirectory",
              createDirectoryName,
              currentLocation
            });
            await promise;
            this.$message.success("create directory successfully.");
          } catch (error) {
            this.uploading = false;
            this.$message.error(`create directory failed with ${error}.`);
          }
        }
      });
    },

    handleRemove(event, action, fileName) {
      const currentLocation = this.getCurrentLocation();
      this.$confirm({
        title: "删除",
        content: h => <div style="color:red;">删除文件 ( {fileName} ) ?</div>,
        onOk: async () => {
          let promise = Promise.resolve();
          event.waitUntil = p => (promise = p);
          try {
            this.$emit("fileOperation", event, {
              type: action,
              fileName,
              currentLocation
            });
            await promise;
            this.$message.success("remove successfully.");
          } catch (error) {
            this.uploading = false;
            this.$message.error(`remove failed with ${error}.`);
          }
        }
      });
    },
    handleRename(event, action, fileName) {
      const currentLocation = this.getCurrentLocation();
      const label = `重命名文件 ( ${fileName} ) `;
      this.$confirm({
        title: "重命名",
        content: h => (
          <a-form-item
            label={label}
            validate-status="warning"
            has-feedback
            help="文件名中不能包括例如/,@,!等特殊字符"
          >
            <a-input id="renameFileName" placeholder="请输入新的文件名" />
          </a-form-item>
        ),
        onOk: async () => {
          let { value: renameFileName } = document.getElementById(
            "renameFileName"
          );
          renameFileName = renameFileName.trim();
          console.info(`renameFileName: ${renameFileName}`);
          if (!renameFileName) {
            this.$message.error("文件名错误");
            return;
          }
          console.info(`emit rename action`);
          let promise = Promise.resolve();
          event.waitUntil = p => (promise = p);
          try {
            this.$emit("fileOperation", event, {
              type: action,
              fileName,
              renameFileName,
              currentLocation
            });
            await promise;
            this.$message.success("remove successfully.");
          } catch (error) {
            this.uploading = false;
            this.$message.error(`remove failed with ${error}.`);
          }
        }
      });
    },
    async onContextMenuClick(event, action, { fileName }) {
      console.log(`You clicked ${action}, fileName: ${fileName}`);
      if (action == "remove") {
        this.handleRemove(event, action, fileName);
      } else if (action == "rename") {
        this.handleRename(event, action, fileName);
      }
    },
    getCurrentLocation() {
      const positions = this.getCurrentPositions();
      let location = [];
      let tempTreeData = this.treeData;
      for (const position of positions) {
        location.push(tempTreeData[position].title);
        tempTreeData = tempTreeData[position].children;
      }
      return location;
    },
    getCurrentPositions() {
      let positions = [];
      this.searchPositions(this.selectedKeys[0], positions, this.treeData);
      positions.reverse();
      return positions;
    },
    handlePositions(positions) {
      const labels = [];
      let currentData = this.treeData;
      for (const index of positions) {
        if (!currentData[index].isLeaf) {
          labels.push(currentData[index].title);
          currentData = currentData[index].children;
        }
      }
      this.pathSegments = labels;
      this.selectedKeys = [labels[labels.length - 1]];
      // update content
      currentData = this.files;
      // positions.shift();
      for (const index of positions) {
        if (currentData[index] && currentData[index].children) {
          // console.info(
          //   `handlePositions, positions:${positions}, index: ${index}, currentData: `,
          //   currentData
          // );
          currentData = currentData[index].children;
        }
      }
      this.dataSource = currentData.filter(
        item => this.showFilesInContentView || !item.children
      );
    },
    onSelect(keys, event) {
      console.info(keys, event);
      const selectTitle = event.node.title;
      const {
        node: { pos }
      } = event;
      const [, ...positions] = pos.split("-");
      console.info(`onSelect positions: ${positions}`);
      this.handlePositions(positions);
    },
    onExpand(keys, event) {
      console.info(`onExpand keys: `, keys);
      this.expandedKeys = keys;
    },
    changeNavigator(title) {
      console.info(`click navigator ${title}`);
      this.selectedKeys = [title];
      const positions = this.getCurrentPositions();
      console.info(`changeNavigator positions: ${positions}`);
      this.handlePositions(positions);
    },
    handleUploadRemove(file) {
      const index = this.fileList.indexOf(file);
      const newFileList = this.fileList.slice();
      newFileList.splice(index, 1);
      this.fileList = newFileList;
    },
    beforeUpload(file) {
      this.fileList = [...this.fileList, file];
      return false;
    },
    async handleUpload(event) {
      const { fileList } = this;
      const formData = new FormData();
      fileList.forEach(file => {
        formData.append("files[]", file);
      });
      console.info(`fileList: ${fileList}`);
      console.info(formData);
      this.uploading = true;
      const currentLocation = this.getCurrentLocation();
      // https://github.com/vuejs/vue/issues/5443
      let promise = Promise.resolve();
      event.waitUntil = p => (promise = p);
      try {
        this.$emit("fileOperation", event, {
          type: "upload",
          formData,
          currentLocation
        });
        await promise;
        this.fileList = [];
        this.uploading = false;
        this.$message.success("upload successfully.");
      } catch (error) {
        this.uploading = false;
        this.$message.error(`upload failed with ${error}.`);
      }
    },
    // https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string
    humanFileSize(bytes, si) {
      var thresh = si ? 1000 : 1024;
      if (Math.abs(bytes) < thresh) {
        return bytes + " B";
      }
      var units = si
        ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
      var u = -1;
      do {
        bytes /= thresh;
        ++u;
      } while (Math.abs(bytes) >= thresh && u < units.length - 1);
      return bytes.toFixed(1) + " " + units[u];
    },
    transform(data, parent, showFiles) {
      for (const record of data) {
        if (record.children) {
          const children = [];
          this.transform(record.children, children, showFiles);
          parent.push({
            title: record.fileName,
            key: record.fileName,
            isLeaf: false,
            children
          });
        } else if (showFiles) {
          parent.push({
            title: record.fileName,
            key: record.fileName,
            isLeaf: true
          });
        }
      }
    },
    searchPositions(key, parent, tree) {
      for (let i = 0; i < tree.length; i++) {
        if (
          tree[i].children &&
          this.searchPositions(key, parent, tree[i].children)
        ) {
          parent.push(i);
          return true;
        }
        if (tree[i].title == key) {
          parent.push(i);
          return true;
        }
      }
      return false;
    }
  }
};
</script>

<style>
.file-manager {
  box-shadow: rgba(0, 0, 0, 0.5) 0px 2pt 6pt;
}

.file-manager-sider .ant-layout-sider-trigger {
  position: inherit;
}

.file-manager-content {
  z-index: 1;
}

ul.v-context {
  box-shadow: rgba(0, 0, 0, 0.5) 0px 2pt 6pt;
  padding: 4px 0px;
}
ul.v-context li a:hover {
  background-color: #007aff;
}

.file-manager-content /deep/ .ant-table-thead > tr.ant-table-row-selected > td,
.file-manager-content /deep/ .ant-table-tbody > tr.ant-table-row-selected > td,
.file-manager-content
  /deep/
  .ant-table-thead
  > tr:hover.ant-table-row-selected
  > td,
.file-manager-content
  /deep/
  .ant-table-tbody
  > tr:hover.ant-table-row-selected
  > td {
  background-color: #ccffcc;
}
</style>
