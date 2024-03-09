#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod command;
mod util;
use std::vec;

#[macro_use]
extern crate lazy_static;
use command::file::{
    create_dir, create_file, delete_file, delete_folder, get_file_content, rename_file,
    simple_read_dir, write_file, write_media_file, file_exists
};
use command::work::{
    add_work_download_task, query_all_task_state
};

use command::project::{
    add_project_download_task, query_project_download_state
};
use command::ssh::{
    get_local_config, update_outer_host, list_files, download_remote_file, upload_remote_file, remote_exec_cmd
};
#[macro_use]
extern crate tauri_command;
use tauri_command::{http::static_server::{http_static_server_status, start_http_static_server, stop_http_static_server}, http::request::http_request};
//use tauri_command::http::{request::http_request, static_server::start_http_static_server, static_server::stop_http_static_server, static_server::http_static_server_status};

use command::http::{parse_js_code, parse_html_title};
use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};
use tauri::{Window, WindowMenuEvent};

fn main() {
    // 这里 `"quit".to_string()` 定义菜单项 ID，第二个参数是菜单项标签。
    let close = CustomMenuItem::new("open_folder".to_string(), "Open Folder");
    let submenu = Submenu::new("File", Menu::new().add_item(close));
    let native_menu = Submenu::new(
        "System",
        Menu::new()
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste)
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::SelectAll),
    );
    let menu = Menu::new().add_submenu(native_menu).add_submenu(submenu);
    //let menu = Menu::os_default(&"sss");
    let ctx = tauri::generate_context!();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_file_content,
            write_file,
            simple_read_dir,
            set_window_title,
            write_media_file,
            create_dir,
            create_file,
            delete_file,
            delete_folder,
            rename_file,
            file_exists,
            add_work_download_task,
            query_all_task_state,
            add_project_download_task, 
            query_project_download_state,
            parse_js_code,
            parse_html_title,
            get_local_config,
            update_outer_host,
            list_files,
            download_remote_file,
            upload_remote_file,
            remote_exec_cmd,
            http_static_server_status,
            start_http_static_server,
            stop_http_static_server,
            http_request
        ])
        .menu(menu)
        .on_menu_event(window_menu_event)
        .run(ctx)
        .expect("error while running tauri application");
}

#[tauri::command]
fn set_window_title(window: Window, title: String) -> String {
    _ = window.set_title(title.as_str());
    String::from("ok")
}

fn window_menu_event(event: WindowMenuEvent) {
    match event.menu_item_id() {
        "quit" => {
            std::process::exit(0);
        }
        "close" => {
            event.window().close().unwrap();
        }
        "open_folder" => {
            _ = event.window().emit("open_folder", "Open Folder");
        }
        &_ => todo!(),
    }
}
