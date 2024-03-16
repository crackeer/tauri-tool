'use client'
import React from 'react';
import 'jsoneditor/dist/jsoneditor.css';
import { Button, Modal, List, Link, Space, Message } from '@arco-design/web-react';
import { save, open } from '@tauri-apps/api/dialog';
import JSONEditor from '@/component/JSONEditor';
import invoke from '@/util/invoke'
import common from '@/util/common'
import cache from '@/util/cache'
import jsonToGo from '@/util/json-to-go';
import { IconSave, IconImport, IconFire, IconAlignCenter, IconRefresh } from '@arco-design/web-react/icon';
import ClickToCopy from '@/component/ClickToCopy';

class App extends React.Component {
    editor = null;
    constructor(props) {
        super(props);
        this.state = {
            viewHeight: 200,
            convert: '',
            convertTitle: '',
            visible: false
        }
    }
    async componentDidMount() {
        this.setState({ viewHeight: common.getViewHeight() })
        let value = await cache.getJSON("JSON.cache")
        setTimeout(() => {
            this.editor.set(value || {})
        }, 800)
        window.onresize = () => {
            this.setState({
                viewHeight: common.getViewHeight(),
            })
        }
    }

    validateJSON = async (value) => {
        cache.setJSON("JSON.cache", value)
    }
    saveJSON = async () => {
        let file = await save({
            filters: [{
                name: "unknown",
                extensions: ['json']
            }]
        });
        if (file == null) return;
        await invoke.writeFile(file, JSON.stringify(this.editor.get()))
        Message.success('保存成功')
    }
    loadJSON = async () => {
        let file = await open({
            multipart: false,
            filters: [{
                name: '',
                extensions: ['json']
            }]
        });
        if (file == null) return;
        let content = await invoke.readFile(file)
        try {
            let json = JSON.parse(content);
            this.editor.set(json)
        } catch (e) {
        }
    }
    toGoStruct = () => {
        let result = jsonToGo(JSON.stringify(this.editor.get()), null, null, false)
        this.setState({
            convert: result.go,
            convertTitle: 'Go结构体',
            visible: true,
        })
    }
    toString = () => {
        this.setState({
            convert: JSON.stringify(JSON.stringify(this.editor.get())),
            convertTitle: '序列化结果',
            visible: true,
        })
    }
    clearJSON = () => {
        this.editor.set({})
    }

    render() {

        return <div>
            <JSONEditor height={this.state.viewHeight} ref={(ele) => {
                this.editor = ele
            }} json={this.state.value} onValidate={this.validateJSON} />
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <Space>
                    <Button onClick={this.loadJSON} type='outline' icon={<IconImport />}>从文件加载JSON</Button>
                    <Button onClick={this.saveJSON} type='outline' icon={<IconSave />}>保存到文件</Button>
                    <Button onClick={this.clearJSON} type='outline' icon={<IconRefresh />}>清空</Button>
                    <Button onClick={this.toGoStruct} type='outline' icon={<IconFire />}>转Go结构体</Button>
                    <Button onClick={this.toString} type='outline' icon={<IconAlignCenter />}>序列化</Button>
                </Space>
            </div>
            <Modal
                title={this.state.convertTitle}
                alignCenter={false}
                visible={this.state.visible}
                footer={null}
                style={{ width: '60%', top: '100' }}
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

    }
}

export default App
