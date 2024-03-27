"use client";
import React from "react";
import "jsoneditor/dist/jsoneditor.css";
import {
  Button,
  Modal,
  List,
  Link,
  Space,
  Message,
  Popconfirm,
  Input,
  Drawer,
} from "@arco-design/web-react";
import {
  IconSave,
  IconImport,
  IconFire,
  IconAlignCenter,
  IconRefresh,
  IconClockCircle,
  IconDown,
  IconShrink,
} from "@arco-design/web-react/icon";
import { save, open } from "@tauri-apps/api/dialog";
import JSONEditor from "@/component/JSONEditor";
import invoke from "@/util/invoke";
import common from "@/util/common";
import cache from "@/util/cache";
import jsonToGo from "@/util/json-to-go";
import dayjs from "dayjs";
import ClickToCopy from "@/component/ClickToCopy";
import { writeText } from "@tauri-apps/api/clipboard";

const cacheKey = "json-create@";
const cacheKeyList = "json-create-list";
const setJSONCache = async (name, value) => {
  await cache.setJSON(cacheKey + name, value);
  addJSONCacheKey(name);
};
const getJSONCache = async (name) => {
  return await cache.getJSON(cacheKey + name);
};

const addJSONCacheKey = async (name) => {
  let list = (await getJSONCacheList()) || [];
  list.push(name);
  if (list.length > 20) {
    list = list.slice(0, 20);
  }
  let object = {};
  for (var i in list) {
    object[list[i]] = true;
  }
  return await cache.setJSON(cacheKeyList, Object.keys(object));
};
const getJSONCacheList = async () => {
  return await cache.getJSON(cacheKeyList);
};

class App extends React.Component {
  editor = null;
  constructor(props) {
    super(props);
    this.state = {
      viewHeight: 200,
      convert: "",
      convertTitle: "",
      visible: false,
      tmpName: "",
      cacheVisible: false,
      cacheNames: [],
    };
  }
  async componentDidMount() {
    this.setState({ viewHeight: common.getViewHeight() });
    window.onresize = () => {
      this.setState({
        viewHeight: common.getViewHeight(),
      });
    };
  }
  onJSONEditorReady = async (ele) => {
    this.editor = ele;
    let value = await cache.getJSON("JSON.cache");
    this.editor.set(value || {});
  };
  validateJSON = async (value) => {
    cache.setJSON("JSON.cache", value);
  };
  saveJSON = async () => {
    let file = await save({
      filters: [
        {
          name: "unknown",
          extensions: ["json"],
        },
      ],
    });
    if (file == null) return;
    await invoke.writeFile(file, JSON.stringify(this.editor.get()));
    Message.success("保存成功");
  };
  saveJSON2Cache = async () => {
    setJSONCache(this.state.tmpName, this.editor.get());
    Message.success("保存成功");
  };
  loadCacheJSON = async () => {
    let list = await getJSONCacheList();
    this.setState({ cacheNames: list, cacheVisible: true });
  };

  loadJSON = async () => {
    let file = await open({
      multipart: false,
      filters: [
        {
          name: "",
          extensions: ["json"],
        },
      ],
    });
    if (file == null) return;
    let content = await invoke.readFile(file);
    try {
      let json = JSON.parse(content);
      this.editor.set(json);
    } catch (e) {}
  };
  toGoStruct = () => {
    let result = jsonToGo(JSON.stringify(this.editor.get()), null, null, false);
    this.setState({
      convert: result.go,
      convertTitle: "Go结构体",
      visible: true,
    });
  };
  toString = () => {
    this.setState({
      convert: JSON.stringify(JSON.stringify(this.editor.get())),
      convertTitle: "序列化结果",
      visible: true,
    });
  };
  clearJSON = () => {
    this.editor.set({});
  };
  importCacheJSON = async (name) => {
    let data = await getJSONCache(name);
    this.editor.set(data);
    this.setState({ cacheVisible: false }, () => {
      Message.info("导入成功");
    });
  };
  copyCacheJSON = async (name) => {
    let data = await getJSONCache(name);
    writeText(JSON.stringify(data)).then(() => {
      Message.info("复制成功");
    });
  };

  render() {
    return (
      <div>
        <JSONEditor
          height={this.state.viewHeight}
          ref={this.onJSONEditorReady}
          json={this.state.value}
          onValidate={this.validateJSON}
        />
        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <Space>
            <Button
              onClick={this.loadJSON}
              type="outline"
              icon={<IconImport />}
            >
              从文件加载
            </Button>
            <Button onClick={this.saveJSON} type="outline" icon={<IconSave />}>
              保存到本地
            </Button>
            <Button
              onClick={this.loadCacheJSON}
              type="outline"
              icon={<IconShrink />}
            >
              从缓存加载
            </Button>
            <Popconfirm
              title="请输入名字"
              content={
                <Input
                  onChange={(value) => {
                    this.setState({ tmpName: value });
                  }}
                  placeholder="请输入名字"
                />
              }
              onOk={this.saveJSON2Cache}
              onCancel={() => {
                this.setState({ tmpName: "" });
              }}
            >
              <Button type="outline" icon={<IconClockCircle />}>
                保存到缓存
              </Button>
            </Popconfirm>
            <Button
              onClick={this.clearJSON}
              type="outline"
              icon={<IconRefresh />}
            >
              清空输入
            </Button>
            <Button
              onClick={this.toGoStruct}
              type="outline"
              icon={<IconFire />}
            >
              转Go结构体
            </Button>
            <Button
              onClick={this.toString}
              type="outline"
              icon={<IconAlignCenter />}
            >
              序列化
            </Button>
          </Space>
        </div>
        <Drawer
          width={350}
          title={<span>JSON缓存列表</span>}
          visible={this.state.cacheVisible}
          onCancel={() => {
            this.setState({ cacheVisible: false });
          }}
          footer={null}
        >
          <List
            dataSource={this.state.cacheNames}
            size="small"
            render={(item, index) => (
              <List.Item
                key={index}
                extra={
                  <Space size="mini">
                    <Button
                      onClick={this.importCacheJSON.bind(this, item)}
                      type="text"
                      size="mini"
                    >
                      导入
                    </Button>
                    <Button
                      onClick={this.copyCacheJSON.bind(this, item)}
                      type="text"
                      size="mini"
                    >
                      复制
                    </Button>
                  </Space>
                }
              >
                {item}
              </List.Item>
            )}
          />
        </Drawer>
        <Modal
          title={this.state.convertTitle}
          alignCenter={false}
          visible={this.state.visible}
          footer={null}
          style={{ width: "60%", top: "100" }}
          autoFocus={false}
          focusLock={true}
          onCancel={() => {
            this.setState({ visible: false });
          }}
        >
          <ClickToCopy value={this.state.convert}>复制</ClickToCopy>
          <pre>{this.state.convert}</pre>
        </Modal>
      </div>
    );
  }
}

export default App;
