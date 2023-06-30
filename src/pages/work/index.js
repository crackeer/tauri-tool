import React from 'react';
import { Button, Table, Modal, List, Input, Message } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import cache from '@/util/cache';
import invoke from '@/util/invoke'
import common from '@/util/common'
import { IconFolder, IconDelete, IconDown, IconLoading } from '@arco-design/web-react/icon';
import { Card, Avatar, Link, Typography, Space, Row } from '@arco-design/web-react';
import { open as ShellOpen } from '@tauri-apps/api/shell';

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            saveName: "",
            workJSON: "",
            saveDir: "",
            files: [],
            query: false,
        }
    }
    async componentDidMount() {
        this.getVRFiles()
    }
    getVRFiles = async () => {
        let files = await cache.getVRFiles()
        let dir = await cache.getVRDir()
        this.setState({
            files: files,
            saveDir: dir,
        })
    }
    htmlTitle = () => {
        return <h3><Space>
            VR下载
            <Button onClick={this.addTask} type="primary" size="mini">新建VR下载任务</Button>
        </Space></h3>
    }
    addTask = async () => {
        this.setState({
            visible: true,
        })
    }
    selectDirectory = async () => {
        let selected = await open({
            directory: true,
            filters: [{
                name: 'File',
                extensions: []
            }],

        });
        if (selected == null) {
            return
        }
        await cache.setVRDir(selected)
        this.getVRFiles()
    }

    toDelete = async (item) => {
        let list = await cache.deleteVRFiles([item.file])
        this.setState({
            files: list
        })
    }
    addDownloadTask = async () => {
        let dir = this.state.saveDir + "/" + this.state.saveName
        let data = await invoke.addDownloadWorkTask(this.state.saveDir + "/" + this.state.saveName, this.state.workJSON)
        if (data.state == "failure") {
            Message.error(data.message + dir)
            return
        }
        console.log(data);
        await cache.addVRFiles([dir])
        this.getVRFiles()
        //this.queryTaskState()
    }
    queryTaskState = async () => {
        if (this.state.query) {
            return false
        }
        this.setState({
            query: true
        })
        setInterval(async () => {
            let data = await invoke.queryDownloadTask()
            console.log(data)
        }, 2000)
    }
    previewVR = async (file) => {
        await ShellOpen(file + '/preview/index.html')
    }

    render() {
        return (
            <div class="app" style={{ margin: '10px auto', width: '88%' }}>
                <List dataSource={this.state.files} size={'small'} render={(item, index) => {
                    return <List.Item key={index} actions={[
                        <span className='list-demo-actions-icon' onClick={() => {
                            this.deleteVRFiles(item);
                        }}>
                            <IconDelete />
                        </span>
                    ]} >
                        <List.Item.Meta
                            avatar={<Avatar shape='square'>VR</Avatar>}
                            title={<Link href={null} onClick={() => this.previewVR(item.file)}>{item.file}</Link>}
                            description={item.time}
                        />
                    </List.Item>
                }} />
                <Modal
                    title='新建下载VR任务'
                    visible={this.state.visible}
                    onCancel={() => {
                        this.setState({ visible: false })
                    }}
                    style={{ width: '70%' }}
                    onOk={this.addDownloadTask}
                >
                    <p>下载目录:</p>
                    <Input.Search value={this.state.saveDir} onChange={(val) => { this.setState({ saveDir: val }) }} searchButton={
                        "选择目录"
                    } defaultValue={this.state.saveDir} placeholder='请选择目录' onSearch={this.selectDirectory} />
                    <p>名称:</p>
                    <Input value={this.state.saveName} onChange={(val) => { this.setState({ saveName: val }) }} />
                    <p>WorkJSON:</p>
                    <Input.TextArea value={this.state.workJSON} onChange={(val) => { this.setState({ workJSON: val }) }} rows={6}></Input.TextArea>
                </Modal>
            </div>
        )
    }
}

export default App
