import React from 'react';
import { Button, Table, Modal, List, Input } from '@arco-design/web-react';
import { open } from '@tauri-apps/api/dialog';
import cache from '@/util/cache';
import invoke from '@/util/invoke'
import common from '@/util/common'
import { IconFolder, IconDelete, IconDown, IconLoading } from '@arco-design/web-react/icon';
import { Card, Avatar, Link, Typography, Space, Row } from '@arco-design/web-react';
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            saveName: "",
            workJSON: "",
            saveDir: "",
            files: [],
        }
    }
    async componentDidMount() {

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
        this.setState({
            saveDir: selected
        })
    }

    toDelete = async (item) => {
        let list = await cache.deleteOpenFiles([item.file])
        this.setState({
            files: list
        })
    }
    execDownload = async() => {
        let data = await invoke.downloadWork(this.state.saveDir + "/" + this.state.saveName, this.state.workJSON)
    }

    render() {
        return (
            <div class="app" style={{ margin: '10px auto', width: '88%' }}>
                <Modal
                    title='新建下载VR任务'
                    visible={this.state.visible}
                    onCancel={() => {
                        this.setState({ visible: false })
                    }}
                    style={{width:'70%'}}
                    onOk={this.execDownload}
                >
                    <p>下载目录:</p>
                    <Input.Search value={this.state.saveDir} onChange={(val) => { this.setState({ saveDir: val }) }} searchButton={
                    "选择目录"
                }  defaultValue={this.state.saveDir} placeholder='请选择目录' onSearch={this.selectDirectory}/>
                    <p>名称:</p>
                    <Input value={this.state.saveName} onChange={(val) => { this.setState({ saveName: val }) }} />
                    <p>WorkJSON:</p>
                    <Input.TextArea value={this.state.workJSON} onChange={(val) => { this.setState({ workJSON: val }) }} rows={6}></Input.TextArea>
                </Modal>
            </div>
        )
    }
}

const Files = (props) => {
    return <List dataSource={props.data} size={'small'} render={(item, index) => {
        return <List.Item key={index} actions={[
            <span className='list-demo-actions-icon' onClick={() => {
                props.deleteFn(item);
            }}>
                <IconDelete />
            </span>
        ]} >
            <List.Item.Meta
                avatar={<Avatar shape='square' style={{ backgroundColor: item.color }}>{item.file_type}</Avatar>}
                title={<Link href={'/file/view?file=' + item.file}>{item.file}</Link>}
                description={item.time}
            />
        </List.Item>
    }} header={<strong>{props.title}</strong>} />
}

export default App
