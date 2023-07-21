import React from 'react';
import { writeText } from '@tauri-apps/api/clipboard';
import JSONEditor from '@/component/JSONEditor'
import { Button, Message, Grid, Space, Card, Tag, Empty, Divider, Modal, Form, Input } from '@arco-design/web-react';
import { IconExclamation, IconLoading, IconEdit, IconRefresh } from '@arco-design/web-react/icon';
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

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: false,
            host: "",

            privateKey: "",
            localConfig: {},
            oldOuterHost: '',
            newOuterHost: '',
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
            privateKey: this.state.privateKey,
        })
        await this.setState({
            editing: false
        })
        Message.success("保存成功")
    }
    getLocalConfig = async () => {
        if (this.state.host.length < 1 || this.state.privateKey.length < 1) {
            Message.error("内网IP和密钥必填")
            return
        }
        let data = await invoke.getLocalConfig(this.state.host, this.state.privateKey)
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
        if (this.state.newOuterHost.length < 1) {
            Message.info("请填写新的外网IP")
            return
        }

        if (!validateIP(this.state.newOuterHost)) {
            Message.error("请填写正确的IP地址")
            return
        }

        let result = invoke.updateOuterHost(this.state.host, this.state.privateKey, this.state.oldOuterHost, this.state.newOuterHost)
        Message.info("更新成功")
        setTimeout(this.getLocalConfig, 1000)
        
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
                            <FormItem label='密钥'>
                                <Input.TextArea placeholder='请填写密钥内容' rows={4} onChange={(val) => {
                                    this.setState({ privateKey: val })
                                }} value={this.state.privateKey}></Input.TextArea>
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
                    </Card>
                </Col>
            </Row >
        </>
    }
}


export default App
