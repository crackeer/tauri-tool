import React from 'react';
import { Button, Input, Grid, Space } from '@arco-design/web-react';
const Row = Grid.Row;
const Col = Grid.Col;
import QRCode from 'qrcode.react';
class Convert extends React.Component {
    constructor(props) {
        super(props); // 用于父子组件传值
        this.state = {
            input: '',
            output: '',
        }
    }
    pageTitle = () => {
        return <h3>QRCode生成</h3>
    }

    render() {
        return (
            <div>
                <Row>
                    <Col span={24}>
                        <Input.TextArea rows={5} onChange={(value) => {
                            this.setState({
                                input: value
                            })
                        }} placeholder='请输入二维码内容'></Input.TextArea>
                    </Col>
                </Row>

                {
                    this.state.input.length > 0 ? <div style={{ margin: '20px auto', textAlign: 'center' }}>
                        <QRCode
                            value={this.state.input}
                            size={300} // 二维码的大小
                            fgColor="#000000" // 二维码的颜色
                        />
                    </div> : null
                }


            </div>

        );
    }
}

export default Convert;