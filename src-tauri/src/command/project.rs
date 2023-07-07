use reqwest;
use serde::{Deserialize, Serialize};
use core::slice::SlicePattern;
use std::collections::HashMap;
use std::fs::{self, File};
use std::path::Path;
use std::sync::{Arc, Mutex};
use tokio;
use zip::write::FileOptions;
use std::io::{copy, Read};
use bytes::Bytes;

#[warn(dead_code)]
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct TaskState {
    state: String,
    percent: usize,
    message: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Task {
    project_id: String,
    db_version: String,
    directory: String,
}

lazy_static! {
    pub static ref TASK_LIST: Arc<Mutex<Vec<Task>>> = Arc::new(Mutex::new(Vec::new()));
    pub static ref TASK_STATE: Arc<Mutex<HashMap<String, TaskState>>> =
        Arc::new(Mutex::new(HashMap::new()));
    pub static ref RUNNING: Arc<Mutex<usize>> = Arc::new(Mutex::new(0));
}

fn get_task() -> Option<Task> {
    let mut list = TASK_LIST.lock().unwrap();
    if list.len() < 1 {
        return None;
    }
    return Some(list.remove(0));
}

fn add_task(dir: Task) {
    TASK_LIST.lock().unwrap().push(dir)
}

fn update_task(task_name: String, task_state: TaskState) {
    TASK_STATE.lock().unwrap().insert(task_name, task_state);
}

fn get_task_state() -> HashMap<String, TaskState> {
    TASK_STATE.lock().unwrap().clone()
}

fn is_running() -> bool {
    return RUNNING.lock().unwrap().gt(&0);
}

fn set_running(flag: usize) {
    let mut running = RUNNING.lock().unwrap();
    *running = flag;
}

// Example code that deserializes and serializes the model.
// extern crate serde;
// #[macro_use]
// extern crate serde_derive;
// extern crate serde_json;
//
// use generated_module::Welcome;
//
// fn main() {
//     let json = r#"{"answer": 42}"#;
//     let model: Welcome = serde_json::from_str(&json).unwrap();
// }

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct Info {
    #[serde(rename = "ProjectID")]
    project_id: String,
    #[serde(rename = "Create_At")]
    create_at: i64,
    time_ref: i64,
    last_modification: i64,
    data: Data,
    scans: Vec<Scan>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Data {
    description: String,
    title: String,
    db_version: String,
    files: Files,
    exported: Option<bool>,
}

#[derive(Serialize, Deserialize)]
pub struct Files {
    #[serde(rename = "planes_0.txt")]
    planes_0_txt: String,
    #[serde(rename = "floor_connect.txt")]
    floor_connect_txt: String,
    #[serde(rename = "windows_0.txt")]
    windows_0_txt: String,
    #[serde(rename = "deleteScans.txt")]
    delete_scans_txt: String,
    #[serde(rename = "360View.txt")]
    the_360_view_txt: String,
    #[serde(rename = "extrinsics.txt")]
    extrinsics_txt: String,
    #[serde(rename = "cornerWalls_0.txt")]
    corner_walls_0_txt: String,
    #[serde(rename = "aligned.txt")]
    aligned_txt: String,
    #[serde(rename = "unaligned.txt")]
    unaligned_txt: String,
    #[serde(rename = "glass3d_0.txt")]
    glass3_d_0_txt: String,
    #[serde(rename = "trims_0.txt")]
    trims_0_txt: String,
    #[serde(rename = "mirrors_0.txt")]
    mirrors_0_txt: String,
    #[serde(rename = "scissor3d_0.txt")]
    scissor3_d_0_txt: String,
    #[serde(rename = "videos.txt")]
    videos_txt: String,
    #[serde(rename = "outdoor.txt")]
    outdoor_txt: String,
    #[serde(rename = "extrinsics_origin.txt")]
    extrinsics_origin_txt: String,
    #[serde(rename = "aligned_floor_region.txt")]
    aligned_floor_region_txt: String,
    #[serde(rename = "aligned_floors.txt")]
    aligned_floors_txt: String,
    floor: String,
    #[serde(rename = "object_points_2d.txt")]
    object_points_2_d_txt: String,
}

#[derive(Serialize, Deserialize)]
pub struct Scan {
    scanid: String,
    #[serde(rename = "Device_SN")]
    device_sn: String,
}

fn get_scan_list(info: &Info) -> Vec<String> {
    let mut derive_list = Vec::<String>::new();
    for item in info.scans.iter() {
        derive_list.push(item.scanid.clone())
    }
    derive_list
}

async fn get_info(project_id: &str, db_version: &str) -> Result<Info, reqwest::Error> {
    let url = format!(
        "http://10.11.1.3:84/vrfile/local/rawdata/{}/info/{}/info.json",
        project_id, db_version
    );
    println!("get info.json url => {}", url);
    let result = reqwest::get(url).await?.json::<Info>().await?;
    Ok(result)
}

pub async fn download_project_to(
    project_id: String,
    db_version: String,
    dir: String,
) -> Result<(), String> {
    let result = get_info(&project_id, &db_version).await;
    if result.is_err() {
        let value = result.err().unwrap().to_string();
        println!("get_info error=>{}", value);
        return Err(value.clone());
    }
    let info = result.unwrap();
    let list = get_scan_list(&info);
    let mut download: Vec<(String, String)> = Vec::new();
    for item in list.iter() {
        let tmp = format!(
            "http://10.11.1.3:84/vrfile/local/rawdata/{}/derived/{}.zip",
            project_id, item
        );
        let mut file_name = String::from(item.clone());
        file_name.push_str(&".zip");
        download.push((tmp, file_name));
    }
    let path = Path::new(&dir);
    let origin_path = path.join(&"zip");
    if let Err(err) = create_file_directory(&dir) {
        return Err(format!(
            "create file directory `{}` failed: {}",
            dir,
            err.as_str()
        ));
    }

    for (index, item) in download.iter().enumerate() {
        download_file(
            item.0.clone(),
            &dir,
            &item.1.clone(),
        )
        .await?;
        update_task(
            dir.clone(),
            TaskState {
                state: "running".to_string(),
                percent: index + 1 / download.len(),
                message: "".to_string(),
            },
        );
    }

    Ok(())
}

fn create_file_directory(dest: &str) -> Result<(), String> {
    let path: &Path = Path::new(dest);
    if let Err(err) = std::fs::create_dir_all(path.parent().unwrap()) {
        return Err(err.to_string());
    }
    return Ok(());
}

async fn download_file(url: String, dir: &str, derived_id : &str) -> Result<(), String> {
   
    //let resp = reqwest::blocking::get(url);
    let client = reqwest::Client::new();
    let builder = client.get(url);
    let result = builder.send().await;

    if let Err(err) = result {
        return Err(err.to_string());
    }

    // Download
    let response = result.unwrap();
    let bytes = response.bytes().await;
    let content = bytes.unwrap().as_ref().clone().to_vec();
    let target = &Path::new(dir).join(format!("{}.zip", derived_id));
    let dest = target.to_str().unwrap();
    if let Err(err) = fs::write(dest, &content) {
        return Err(err.to_string());
    }
    // Extract
    let extract_target =  &Path::new(dir).join(format!("{}", derived_id));
    extract(dest, extract_target.to_str().unwrap());
    Ok(())
}

#[tauri::command]
pub async fn add_project_download_task(
    dir: String,
    project_id: String,
    db_version: String,
) -> TaskState {
    println!("{},{},{}", project_id, db_version, dir);
    add_task(Task {
        project_id: project_id.clone(),
        db_version: db_version.clone(),
        directory: dir.clone(),
    });
    update_task(
        project_id.clone(),
        TaskState {
            state: "waiting".to_string(),
            percent: 0,
            message: "waiting".to_string(),
        },
    );

    if !is_running() {
        tokio::spawn(download_projects_from_task_list());
    }

    return TaskState {
        message: "success".to_string(),
        state: "success".to_string(),
        percent: 0,
    };
}

async fn download_projects_from_task_list() -> Result<String, String> {
    set_running(1);
    loop {
        let task_result = get_task();
        if task_result.is_none() {
            break;
        }
        let task = task_result.unwrap();
        println!("get task {}", task.project_id);
        update_task(
            task.project_id.clone(),
            TaskState {
                state: "running".to_string(),
                percent: 10,
                message: "".to_string(),
            },
        );
        match download_project_to(
            task.project_id.clone(),
            task.db_version.clone(),
            task.directory.clone(),
        )
        .await
        {
            Ok(_) => update_task(
                task.project_id.clone(),
                TaskState {
                    state: "success".to_string(),
                    percent: 10,
                    message: "".to_string(),
                },
            ),
            Err(err) => update_task(
                task.project_id.clone(),
                TaskState {
                    state: "failure".to_string(),
                    percent: 10,
                    message: err.to_string(),
                },
            ),
        }
    }
    set_running(0);
    Ok("Ok".to_string())
}
#[tauri::command]
pub async fn query_project_download_state() -> HashMap<String, TaskState> {
    get_task_state()
}


fn extract(test: &str , mut dest: &str) {
    let zipfile = std::fs::File::open(&test).unwrap();
    let mut zip = zip::ZipArchive::new(zipfile).unwrap();

    let mut target = Path::new(dest);
    if !target.exists() {
        fs::create_dir_all(target).map_err(|e| {
            println!("{}", e);
        });
    }
    for i in 0..zip.len() {
        let mut file = zip.by_index(i).unwrap();
        if file.is_dir() {
            println!("file utf8 path {:?}", file.name_raw());//文件名编码,在windows下用winrar压缩的文件夹，中文文夹件会码(发现文件名是用操作系统本地编码编码的，我的电脑就是GBK),本例子中的压缩的文件再解压不会出现乱码
            let target = target.join(Path::new(&file.name().replace("\\", "")));
            fs::create_dir_all(target).unwrap();
        } else {
            let file_path = target.join(Path::new(file.name()));
            let mut target_file = if !file_path.exists() {
                println!("file path {}", file_path.to_str().unwrap());
                fs::File::create(file_path).unwrap()
            } else {
                fs::File::open(file_path).unwrap()
            };
            copy(&mut file, &mut target_file);
            // target_file.write_all(file.read_bytes().into());
        }
    }
}