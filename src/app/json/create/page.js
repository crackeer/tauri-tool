'use client'
import React from 'react';
import 'jsoneditor/dist/jsoneditor.css';
import { Button, Modal, List, Link, Space, Message } from '@arco-design/web-react';
import { save } from '@tauri-apps/api/dialog';
import JSONEditor from '@/component/JSONEditor';
import invoke from '@/util/invoke'
import common from '@/util/common'
import { IconSave } from '@arco-design/web-react/icon';

class App extends React.Component {
    editor = null;
    constructor(props) {
        super(props);
        this.state = {
            file: '',
            value: {},
            viewHeight: 0,
        }
    }
    async componentDidMount() {
        let file = common.getQuery("file", '')
        let content = {}
        if (file.length > 0) {
            let value = await invoke.readFile(file)
            try {
                content = JSON.parse(value)
            } catch (e) {

            }
        }

        await this.setState({
            viewHeight: common.getViewHeight(),
            file: file,
            value: content,
        })
        window.onresize = () => {
            this.setState({
                viewHeight: common.getViewHeight(),
            })
        }
    }
    pageTitle = () => {
        if (this.state.file.length > 0) {
            return <h3>编辑`{this.state.file}`</h3>
        }
        return <h3>创建JSON</h3>
    }

    changeJSON = async (value) => {
        try {
            let json = JSON.parse(value)
            await this.setState({ value: json })
        } catch (e) {

        }
    }
    toSave = async () => {
        let file = this.state.file
        if (file.length < 1) {
            file = await save({
                filters: [{
                    name: "unknown",
                    extensions: ['json']
                }]
            });
        }
        if (file == null) return;
        await invoke.writeFile(file, JSON.stringify(this.state.value))
        if (this.state.file.length < 1) {
            Message.info('文件创建成功')
            await this.setState({
                file: file,
            })
            setTimeout(this.props.updateTitle, 100);
            this.props.updateTitle()
        } else {
            Message.info('文件保存成功')
        }

    }

    render() {

        return <div class="app" onKeyUp={this.handleKeyUp} tabIndex="-1">
            <JSONEditor height={this.state.viewHeight} ref={(ele) => {
                this.editor = ele
            }} json={this.state.value} onChangeText={this.changeJSON} />
            <div style={{ position: 'fixed', right: '40px', bottom: '100px' }}>
                <Button onClick={this.toSave} type='outline' icon={<IconSave />}>保存</Button>
            </div>
        </div>

    }
}

export default App
