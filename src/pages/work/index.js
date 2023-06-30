import React from 'react';
import { Button, Table, Modal, List, Input, Message, Progress } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import cache from '@/util/cache';
import invoke from '@/util/invoke'
import common from '@/util/common'
import { IconFolder, IconDelete, IconDown, IconLoading } from '@arco-design/web-react/icon';
import { Card, Avatar, Link, Typography, Space, Row } from '@arco-design/web-react';
import { open as ShellOpen } from '@tauri-apps/api/shell';

class App extends React.Component {
    timer = null
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            saveName: "",
            workJSON: "",
            saveDir: "",
            files: [],
            runningTask: {},
        }
    }
    async componentDidMount() {
        this.getVRFiles()
        this.queryTaskState()
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
        let data = await invoke.addDownloadWorkTask(dir, this.state.workJSON)
        if (data.state == "failure") {
            Message.error(data.message + dir)
            return
        }
        console.log(data);
        await cache.addVRFiles([dir])
        await this.getVRFiles()
    }
    queryTaskState = async () => {
        let data = await invoke.queryDownloadTask()
        let tasks = Object.keys(data);
        await this.setState({
            runningTask: data,
        })
        setTimeout(this.queryTaskState, 2000)
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
                            this.toDelete(item);
                        }}>
                            <IconDelete />
                        </span>
                    ]} >
                        <List.Item.Meta
                            avatar={<Avatar shape='square'>VR</Avatar>}
                            title={<Link href={null} onClick={() => this.previewVR(item.file)}>{item.file}</Link>}
                            description={this.state.runningTask[item.file] != undefined ? <>
                                <TaskState data={this.state.runningTask[item.file]} />
                            </> : null}
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

const TaskState = (props) => {
    if(props.data.state == 'success') {
        return <>下载成功</>
    }
    if(props.data.state == 'failure') {
        return <>下载失败，{props.data.message}</>
    }

    if(props.data.state == 'running') {
        if (props.data.percent > 0) {
            return <>下载中<Progress percent={props.data.percent }  /></>
        }
        return <>下载中</> 
    }

    if(props.data.state == 'waiting') {
        return <>等待下载</>
    }
    return <>{props.state}</>
}

export default App
