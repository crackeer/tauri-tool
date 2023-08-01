import React from 'react';
import { open } from '@tauri-apps/api/dialog';
import { writeText } from '@tauri-apps/api/clipboard';
import JSONEditor from '@/component/JSONEditor'
import { Button, Message, Grid, Space, Card, Tag, Link, Divider, Modal, Form, Input, Table } from '@arco-design/web-react';
import { IconExclamation, IconLoading, IconEdit, IconRefresh, IconObliqueLine } from '@arco-design/web-react/icon';
import api from '@/util/api';
import cache from '@/util/cache';
import invoke from '@/util/invoke';
import dayjs from 'dayjs';
import { message } from 'antd';
const Row = Grid.Row;
const Col = Grid.Col;
const FormItem = Form.Item;

function validateIP(input) {
    var regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
    return regex.test(input);
}

async function generateQuickDirs(directory) {
    const { sep } = await import('@tauri-apps/api/path');
    let parts = directory.split(sep)
    let list = []
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].length > 0) {
            list.push({
                path: parts.slice(0, i + 1).join(sep),
                name: parts[i]
            })
        }

    }
    return list
}

class App extends React.Component {
    columns = [
        {
            'title': '名字',
            'dataIndex': 'name',
            'key': 'name',
            'render': (col, record, index) => (
                record.is_dir ? <a href="javascript:;" onClick={this.selectDir.bind(this, record.name)}>{record.name}</a> : <span>{record.name}</span>
            )
        },
        {
            'title': '权限',
            'dataIndex': 'access',
            'key': 'access',
        },
        {
            'title': '时间',
            'dataIndex': 'time',
            'key': 'access',
            'render': (col, record, index) => (
                <>
                    {record.month} {record.day} {record.time}
                </>
            )

        },
        {
            'title': '大小',
            'dataIndex': 'size',
            'key': 'size',
        },
        {
            'title': '用户',
            'dataIndex': 'user',
            'key': 'user',
        },
        {
            'title': '操作',
            'key': 'opt',
            'render': (col, record, index) => {
                return <Space>
                    <Button onClick={this.selectDir.bind(this, record)} size="mini">下载</Button>
                </Space>
            }
        }
    ]
    constructor(props) {
        super(props);
        this.state = {
            editing: false,
            host: "",

            privateKeyPath: "",
            localConfig: {},
            oldOuterHost: '',
            newOuterHost: '',

            directory: '/',
            quickDirs: [],
            files: [],
            fileLoading: false
        }
    }
    async componentDidMount() {
        let data = await cache.getCacheHost()
        await this.setState(data)
        setTimeout(this.getLocalConfig, 1000)
    }
    doSaveCacheHost = async () => {
        await cache.setCacheHost({
            host: this.state.host,
            privateKeyPath: this.state.privateKeyPath,
        })
        await this.setState({
            editing: false
        })
        Message.success("保存成功")
    }
    getLocalConfig = async () => {
        if (this.state.host.length < 1 || this.state.privateKeyPath.length < 1) {
            Message.error("内网IP和密钥必填")
            return
        }
        let data = await invoke.getLocalConfig(this.state.host, this.state.privateKeyPath)
        try {
            let config = JSON.parse(data[0])
            let downloadHost = config['download_host']
            let parts = downloadHost.split('/')
            console.log(parts)
            this.setState({
                oldOuterHost: parts[parts.length - 1].split(':')[0]
            })

        } catch (e) {
            Message.error("获取Config失败")
        }
        console.log(JSON.parse(data[0]))
    }

    doUpdateOuterHost = async () => {
        if (this.state.oldOuterHost.length < 1) {
            Message.info("旧外网IP未获取到，请刷新")
            return
        }
        if (this.state.newOuterHost.length < 1) {
            Message.info("请填写新的外网IP")
            return
        }

        if (!validateIP(this.state.newOuterHost)) {
            Message.error("请填写正确的IP地址")
            return
        }

        let result = invoke.updateOuterHost(this.state.host, this.state.privateKeyPath, this.state.oldOuterHost, this.state.newOuterHost)
        Message.info("更新成功")
        setTimeout(this.getLocalConfig, 1000)

    }
    selectPrivateKeyPath = async () => {
        let selected = await open({
            directory: false,
            multiple: false,
            filters: [{
                name: 'File',
                extensions: ['txt']
            }],
        });
        if (selected == null || selected.length < 1) {
            return
        }
        this.setState({
            privateKeyPath: selected
        })
    }

    listFiles = async () => {
        let result = await invoke.listFiles(this.state.host, this.state.privateKeyPath, this.state.directory)

        if (!result.success) {
            Message.error(result.message)
            await this.setState({
                fileLoading: false
            })
            return
        }
        result.data.sort((a, b) => {
            if (a.is_dir) {
                return -1
            }
            return 1
        })
        let quickDirs = await generateQuickDirs(this.state.directory)

        await this.setState({
            files: result.data,
            quickDirs: quickDirs,
            fileLoading: false
        })

    }
    gotoDir = async (item) => {
        await this.setState({
            directory: item.path,
            files: [],
        })
        setTimeout(this.listFiles, 100)
    }
    selectDir = async (name) => {
        const { join } = await import('@tauri-apps/api/path');
        let dir = await join(this.state.directory, name)
        await this.setState({
            directory: dir,
            files: [],
            fileLoading: true
        })
        setTimeout(this.listFiles, 100)
    }

    render() {
        return <>
            <Row gutter={20}>
                <Col span={24} style={{ marginBottom: '20px' }}>
                    <Card title="替换外网IP">
                        <Form autoComplete='off'>
                            <FormItem label='内网IP'>
                                <Input placeholder='请填写服务内网IP' onChange={(val) => {
                                    this.setState({ host: val })
                                }} value={this.state.host} />
                            </FormItem>
                            <FormItem label='密钥地址'>
                                {this.state.privateKeyPath}
                                <Button onClick={this.selectPrivateKeyPath}>Select</Button>
                            </FormItem>
                            <FormItem wrapperCol={{ offset: 5 }}>
                                <Button type='primary' onClick={this.doSaveCacheHost}>保存该配置</Button>
                            </FormItem>
                        </Form>
                        <Divider> </Divider>
                        <Card>
                            <h2>
                                当前外网IP：{this.state.oldOuterHost}<Button onClick={this.getLocalConfig} icon={<IconRefresh />} size='small'></Button>
                            </h2>
                            <h4>
                                新外网IP:
                            </h4>
                            <Row gutter={30}>
                                <Col span={10}>
                                    <Input placeholder='新外网IP' onChange={(val) => {
                                        this.setState({ newOuterHost: val })
                                    }} value={this.state.newOuterHost} size="large" />
                                </Col>
                                <Col span={4}>
                                    <Button onClick={this.doUpdateOuterHost} type='primary'>更新</Button>
                                </Col>
                            </Row>

                        </Card>

                        <Card style={{ marginTop: '20px' }}>
                            <Space split={<IconObliqueLine />} align={'center'} size={0} style={{ marginRight: '0' }}>
                                <Link onClick={this.gotoDir.bind(this, { path: '/' })} style={{ fontSize: '20px' }} key={'/'}>根目录</Link>
                                {
                                    this.state.quickDirs.map(item => {
                                        return <Link onClick={this.gotoDir.bind(this, item)} style={{ fontSize: '20px' }} key={item.path}>{item.name}</Link>
                                    })
                                }
                            </Space>
                            <Button onClick={this.listFiles} type='primary' size='mini'>更新</Button>
                            <Table data={this.state.files} columns={this.columns} pagination={false} rowKey={'name'}
                                scroll={{ y: 800 }} border={false} footer={this.state.directory} loading={this.state.fileLoading} />
                        </Card>
                    </Card>
                </Col>
            </Row >
        </>
    }
}


export default App
