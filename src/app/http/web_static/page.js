'use client'
import React from "react";
import { open } from "@tauri-apps/api/dialog";
import {
    Button,
    Card,
    Message,
    Form,
    Input,
    Grid,
    Breadcrumb,
    Radio,
    Divider,
    Space,
    Link,
} from "@arco-design/web-react";
import { IconPlayArrow, IconLoading } from "@arco-design/web-react/icon";
import cache from "@/util/cache";
import invoke from "@/util/invoke";
import { getQuery } from "@/util/common";
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const BreadcrumbItem = Breadcrumb.Item;
class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            staticPath: "",
            port: 8888,
            running: 0,
            local_addr: '',
        };
    }
    async componentDidMount() {
        let result = await invoke.httpServerStatus()
        if (result.success && result.data.running > 0) {
            this.setState(result.data)
        } else {
            let data = await cache.getStaticServerConfig();
            this.setState(data);
        }
    }
    selectStaticPath = async () => {
        let selected = await open({
            directory: true,
            multiple: false,
        });
        if (selected == null || selected.length < 1) {
            return;
        }
        this.setState({
            staticPath: selected,
        });
        cache.setStaticServerConfig({
            staticPath: selected,
            port: this.state.port,
        })
    };
    setPort = async (value) => {
        this.setState({
            port: value,
        });
        cache.setStaticServerConfig({
            staticPath: this.state.staticPath,
            port: value
        })
    }
    startHTTP = async () => {
        if (this.state.running > 0) {
            await this.stopHTTP()
            return
        }
        if (this.state.staticPath.length < 1 || this.state.port < 1) {
            Message.error('参数有误')
            return
        }
        let result = await invoke.startHTTPServer(this.state.staticPath, parseInt(this.state.port))
        if (result.success) {
            result = await invoke.getLocalAddr()
            if (result.success) {
                Message.success("静态资源服务启动成功")
                this.setState({
                    running: 1,
                    local_addr: result.data.addr,
                })
            }
            

            return
        } else {
            Message.error(result.message)
        }
    }
    stopHTTP = async () => {
        let result = await invoke.stopHTTPServer()
        if (result.success) {
            Message.success("静态资源服务已停止")
            this.setState({
                running: 0,
            })
            return
        } else {
            Message.error(result.message)
        }
    }

    render() {
        return <div>
            <Card  >
                <Form autoComplete="off">
                    <FormItem label="静态资源文件夹" >
                        <Grid.Row gutter={8}>
                            <Grid.Col span={18}>
                                <Input
                                    placeholder="请选择"
                                    value={this.state.staticPath}
                                    disabled={this.state.running > 0}
                                />
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Button onClick={this.selectStaticPath} type="primary" disabled={this.state.running > 0}>选择文件夹</Button>
                            </Grid.Col>
                        </Grid.Row>
                    </FormItem>
                    <FormItem label="服务端口">
                        <Grid.Row gutter={8}>
                            <Grid.Col span={18}>
                                <Input
                                    placeholder="服务端口"
                                    onChange={this.setPort}
                                    value={this.state.port}
                                    disabled={this.state.running > 0}
                                />
                            </Grid.Col>
                        </Grid.Row>
                    </FormItem>
                    <FormItem wrapperCol={{ offset: 5 }}>
                        <Button type="primary" status={this.state.running > 0 ? 'danger' : ''} onClick={this.startHTTP} icon={this.state.running ? <IconLoading /> : <IconPlayArrow />}>{this.state.running > 0 ? '服务运行中,点击停止服务' : '启动'}</Button>
                    </FormItem>
                    {
                        this.state.running > 0 ? <Divider><Space>
                            {
                                this.state.local_addr.length > 0 ? <Link href={'http://' + this.state.local_addr + ':' + this.state.port} target='_blank'>http://{this.state.local_addr}:{this.state.port}</Link> : null
                            }
                            <Link href={'http://localhost:' + this.state.port} target='_blank'>http://localhost:{this.state.port}</Link>
                        </Space> </Divider> : null
                    }

                </Form>
            </Card>
        </div>;
    }
}

export default App;
