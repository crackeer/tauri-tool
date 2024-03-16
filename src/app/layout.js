'use client'
import React, { useState, useEffect } from 'react';
import { Breadcrumb, Link, Space } from '@arco-design/web-react';
import '@/styles/globals.css'
import "@arco-design/web-react/dist/css/arco.css";
import { Layout, Menu, Affix, Divider } from '@arco-design/web-react';
import menu from "@/config/menu"
import invoke from "@/util/invoke"
const Sider = Layout.Sider;
const MenuItem = Menu.Item;

const BreadcrumbItem = Breadcrumb.Item;

export default function RootLayout({
    children
}) {

    const [collapsed, setCollapse] = useState(false);
    const [activeMenuKey, setActiveMenuKey] = useState([])
    useEffect(() => {
        setActiveMenuKey([window.location.pathname])
        for(let i = 0; i < menu.length; i++) {
            if(menu[i].key === window.location.pathname) {
                invoke.setWindowTitle(menu[i].title)
            }
        }
    }, []);
    const clickMenuItem = (item) => {
        window.location.href = item
    }
    return (
        <html lang="en">
            <body>
                <Layout>
                    <Sider
                        theme='light'
                        collapsed={collapsed}
                        style={{
                            overflow: 'auto',
                            height: '100vh',
                            position: 'fixed',
                            left: 0,
                            top: 0,
                            bottom: 0,
                        }}
                    >
                        <Menu onClickMenuItem={clickMenuItem} theme='light' accordion={false} selectedKeys={activeMenuKey}>
                            {
                                menu.map(item => {
                                    return <MenuItem key={item.key} >
                                       {item.icon}{item.title}
                                    </MenuItem>
                                })
                            }
                        </Menu>
                    </Sider>
                    <Layout style={{ marginLeft: '200px', padding: '10px 20px' }}>
                        {children}
                    </Layout>
                </Layout>
            </body>
        </html>
    )
}