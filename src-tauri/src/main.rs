#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::vec;

extern crate lazy_static;
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

#[macro_use]
extern crate rust_box;
use rust_box::tauri_command::network::get_local_addr;
use rust_box::tauri_command::ssh::{
    download_remote_file, remote_exec_command, remote_list_files, upload_remote_file,
};
use rust_box::tauri_command::{
    http_request::{do_http_request, parse_github_ip, parse_html_title, parse_js_code},
    http_server::{start_static_server, static_server_status, stop_static_server},
};

use rust_box::tauri_command::file::{
    create_dir, create_file, delete_dir, delete_file, file_exists, get_file_content, list_folder,
    rename_file, write_file, write_media_file,
};
use rust_box::tauri_command::js::run_js_code;

use tauri::{Menu, MenuItem, Submenu};
use tauri::{Window, WindowMenuEvent};

fn main() {
    let native_menu = Submenu::new(
        "System",
        Menu::new()
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste)
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::SelectAll),
    );
    let menu = Menu::new().add_submenu(native_menu);
    //let menu = Menu::os_default(&"sss");
    let ctx = tauri::generate_context!();
    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:sqlite.db", get_sqlite_migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            get_file_content,
            write_file,
            list_folder,
            set_window_title,
            write_media_file,
            create_dir,
            create_file,
            delete_file,
            delete_dir,
            rename_file,
            file_exists,
            parse_js_code,
            parse_html_title,
            remote_list_files,
            download_remote_file,
            upload_remote_file,
            remote_exec_command,
            static_server_status,
            start_static_server,
            stop_static_server,
            do_http_request,
            get_local_addr,
            parse_github_ip,
            run_js_code
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

fn get_sqlite_migrations() -> Vec<Migration> {
    vec![
        // Define your migrations here
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "CREATE TABLE content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                content_type TEXT NOT NULL,
                tag TEXT NOT NULL,
                create_at INTEGER DEFAULT '0',
                modify_at INTEGER DEFAULT '0'
            );",
            kind: MigrationKind::Up,
        },
    ]
}
