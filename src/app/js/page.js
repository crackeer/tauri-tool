'use client'
import React, { useEffect } from 'react'
import Script from 'next/script'
//import * as monacoConfig from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import { Button, Input } from '@arco-design/web-react';
import { IconPlayArrow } from "@arco-design/web-react/icon";
const codeTmpl = `for(var i = 1;i< 10000;i++) {
    console.log(i)
}`
export default function App() {
    const [code, setCode] = React.useState(codeTmpl)
    const [output, setOutput] = React.useState([])
    const [running, setRunning] = React.useState(false)
    useEffect(() => {
        var initFunction = async () => {
            //let monacoConfig = await import('monaco-editor');裁掉

            loader.config({
                path: {
                    vs: "node_modules/monaco-editor/min/vs"
                }
            });
            loader.init().then((monaco) => {
                const wrapper = document.getElementById('monaco-editor');
                //wrapper.style.height = '100vh';
                const properties = {
                    value: codeTmpl,
                    language: 'javascript',
                    theme: 'vs-dark',
                    formatOnPaste: true,
                };
                //alert(66)
                window.codeEditor = monaco.editor.create(wrapper, properties);
            });
        }
        initFunction()
    }, [])

    const runJsCode = () => {
        setOutput([])
        setRunning(true)
        let kernal = new window.BlogCells.JavaScriptKernel();
        let runOutput = []
        kernal.run(window.codeEditor.getValue(), (val, err) => {
            runOutput.push(val.line)
        })
        setTimeout(() => {
            setOutput(runOutput)
            setRunning(false)
        }, 5000)
    }
    const changeCode = (value) => {
        setCode(value)
    }
    return <div>
        <Script src={'/blog-cells.min.js'} />
        <div style={{ height: '350px' }} id="monaco-editor"></div>
        <div style={{ margin: '10px 0' }}>
            <Button onClick={runJsCode} icon={<IconPlayArrow />} loading={running} type='primary'>run code</Button>
        </div>
        <Input.TextArea value={output.join("\r\n")} rows={10} placeholder="js output"></Input.TextArea>
    </div>
}
