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
            projectID: "",
            dbVersion : '',
            saveDir: "",
            files: [],
            runningTask: {},
        }
    }
    async componentDidMount() {
        await this.getProjects()
        this.queryTaskState()
        this.ifDownloadNew()
    }
    ifDownloadNew = async () => {
        let dbVersion = common.getQuery('db_version', '');
        let projectID = common.getQuery('project_id', '');
        let projectName = common.getQuery('project_name', '')
        if(dbVersion.length > 0 && projectID.length > 0) {
            await this.setState({
                dbVersion : dbVersion,
                projectID : projectID,
                saveName : projectName,
                visible : true
            })
        }
    }
    getProjects = async () => {
        let files = await cache.getProject()
        let projectSaveDir = await cache.getProjectSaveDir()
        this.setState({
            files: files,
            saveDir : projectSaveDir,
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
        console.log(data)
        await this.setState({
            runningTask: data,
        })
        setTimeout(this.queryTaskState, 2000)
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
        await cache.setProjectSaveDir(selected)
        this.getProjects()
    }
    addDownloadTask = async () => {
        if(this.state.saveDir.length < 1) {
            Message.error('Please select download directory')
            return
        }
        if(this.state.saveName.length < 1) {
            Message.error('Please input download name')
            return
        }
        if (this.state.projectID.length < 1) {
            Message.error('Please input project_id')
            return
        }
        if (this.state.dbVersion.length < 1) {
            Message.error('Please input db_version')
            return
        }
        const {join} = await import('@tauri-apps/api/path');
        let realPath = await join(this.state.saveDir, this.state.saveName);
        let data = await invoke.addProjectDownload(realPath, this.state.projectID, this.state.dbVersion)
       
        if (data.state == "failure") {
            Message.error(data.message)
            return
        }
        await cache.addProject([realPath])
        Message.success('已添加到下载列表')
        await this.getProjects()
        this.setState({
            visible : false,
            saveName : '',
        })
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
                
                <Modal
                    title='新建下载Project任务'
                    visible={this.state.visible}
                    onCancel={() => {
                        this.setState({ visible: false })
                    }}
                    style={{ width: '55%' }}
                    onOk={this.addDownloadTask}
                >
                    <p>下载目录:</p>
                    <Input.Search value={this.state.saveDir} onChange={(val) => { this.setState({ saveDir: val }) }} searchButton={
                        "选择目录"
                    } defaultValue={this.state.saveDir} placeholder='请选择目录' onSearch={this.selectDirectory} />
                    <p>名称:</p>
                    <Input value={this.state.saveName} onChange={(val) => { this.setState({ saveName: val }) }} />
                    <p>ProjectID：{this.state.projectID}</p>
                    <p>DBVersion：{this.state.dbVersion}</p>
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
