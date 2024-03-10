'use client'
import React, { useState, useEffect } from 'react';
import { Breadcrumb, Link, Space } from '@arco-design/web-react';
import '@/styles/globals.css'
import "@arco-design/web-react/dist/css/arco.css";
import { Layout, Menu, Affix, Divider } from '@arco-design/web-react';
import menu from "../config/menu"
const Sider = Layout.Sider;
const MenuItem = Menu.Item;

const BreadcrumbItem = Breadcrumb.Item;

export default function RootLayout({
    children
}) {

    const [collapsed, setCollapse] = useState(false);
    const [activeMenuKey, setActiveMenuKey] = useState('')
    useEffect(() => {
        setActiveMenuKey(window.location.pathname)
    }, []);
    const getMarginLeft = () => {
        if (collapsed) {
            return "48px"
        }
        return "200px"
    }
    const clickMenuItem = (item) => {
        window.location.href = item
    }
    return (
        <html lang="en">
            <body>
                <Layout>
                    <Sider
                        theme='dark'
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
                        <Menu onClickMenuItem={clickMenuItem} theme='dark' accordion={false}>
                            {
                                menu.map(item => {
                                    return <MenuItem key={item.key} className={activeMenuKey == item.key ? 'active-menu' : ''}>
                                       {item.icon}{item.title}
                                    </MenuItem>
                                })
                            }
                        </Menu>
                    </Sider>
                    <Layout style={{ marginLeft: getMarginLeft(), padding: '10px 20px' }}>
                        {children}
                    </Layout>
                </Layout>
            </body>
        </html>
    )
}