import React from 'react';
import { Button, Table, Modal, List, Input, Message, Progress } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import cache from '@/util/cache';
import invoke from '@/util/invoke'
import common from '@/util/common'
import { IconFolder, IconDelete, IconLoading } from '@arco-design/web-react/icon';
import { Card, Avatar, Link, Space, Row } from '@arco-design/web-react';
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
        this.getProjects()
        this.queryTaskState()
    }
    getProjects = async () => {
        let files = await cache.getProject()
        this.setState({
            files: files,
        })
    }
    htmlTitle = () => {
        return <h3><Space>
            Project下载记录
        </Space></h3>
    }
    toDelete = async (item) => {
        let list = await cache.deleteProject([item.file])
        this.setState({
            files: list
        })
    }
    openProject = async (item) => {
        await ShellOpen(item.file)
    }
    queryTaskState = async () => {
        let data = await invoke.queryProjectDownloadTask()
        let tasks = Object.keys(data);
        await this.setState({
            runningTask: data,
        })
        setTimeout(this.queryTaskState, 2000)
    }

    render() {
        return (
            <div class="app" style={{ margin: '10px auto', width: '88%' }}>
                <List dataSource={this.state.files} size={'small'} render={(item, index) => {
                    return <List.Item key={index} actions={[
                        <span onClick={() => {
                            this.toDelete(item);
                        }}>
                            删除记录
                        </span>
                    ]} >
                        <List.Item.Meta
                            avatar={<Avatar shape='square'>P</Avatar>}
                            title={<Link href={null} onClick={() => this.openProject(item)}>{item.file}</Link>}
                            description={this.state.runningTask[item.file] != undefined ? <>
                                <TaskState data={this.state.runningTask[item.file]} />
                            </> : null}
                        />
                    </List.Item>
                }} />
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
