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
            } catch(e) {

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

    handleKeyUp = async (event) => {
        if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            console.log(this.state.file_type, common.getFileExtByType(this.state.file_type))
            let filePath = await save({
                filters: [{
                    name: this.state.file_type,
                    extensions: [common.getFileExtByType(this.state.file_type)]
                }]
            });
            if (filePath == null || filePath.length === 0) {
                return
            }
            let content = this.state.value
            if (this.state.file_type == common.FileTypeJSON) {
                content = JSON.stringify(this.state.value)
            }
            await invoke.writeFile(filePath, content)
            Message.info('保存成功')
            window.location.href = "/file/view?file=" + filePath
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
