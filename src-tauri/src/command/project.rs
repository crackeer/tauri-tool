use reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::path::Path;
use std::sync::{Arc, Mutex};
use tokio;

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
    exported: bool,
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

fn get_scan_list(info : &Info) -> Vec<String> {
    let mut derive_list = Vec::<String>::new();
    for item in info.scans.iter() {
        derive_list.push(item.scanid.clone())
    }
    derive_list
}

async fn get_info(project_id: &str, db_version : &str) -> Result<Info, reqwest::Error> {
    let client = reqwest::Client::new();
    let url = format!("http://10.11.1.3:84/vrfile/local/rawdata/{}/info/{}/info.jso", project_id, db_version);

    let result = reqwest::get(url).await?.json::<Info>().await?;
    Ok(result)
}

pub async fn download_project_to(project_id: String, db_version : String, dir: String) -> Result<(), String> {
    let result = get_info(&project_id, &db_version).await;
    if result.is_err() {
        return Err(result.err().unwrap().to_string())
    }
    let info = result.unwrap();
    let list = get_scan_list(&info);
    let mut download: Vec<(String, String)> = Vec::new();
    for item in list.iter() {
        let tmp = format!("http://10.11.1.3:84/vrfile/local/rawdata/{}/derived/{}.zip", project_id, item);
        download.push((tmp, item.clone()));
    }
    let path = Path::new(&dir);
    let origin_path = path.join(&"zip");
    for (index, item) in download.iter().enumerate() {
        download_file(
            item.0.clone(),
            origin_path.join(item.1.clone()).to_str().unwrap(),
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

async fn download_file(
    url: String,
    dest: &str,
) -> Result<(), String> {
    if let Err(err) = create_file_directory(dest) {
        return Err(format!(
            "create file directory `{}` failed: {}",
            dest,
            err.as_str()
        ));
    }
   
    //let resp = reqwest::blocking::get(url);
    let client = reqwest::Client::new();
    let builder = client.get(url);
    let result = builder.send().await;

    if let Err(err) = result {
        return Err(err.to_string());
    }
    let response = result.unwrap();
    let bytes = response.bytes().await;
    let content = bytes.unwrap().as_ref().clone().to_vec();
    if let Err(err) = fs::write(dest, &content) {
        return Err(err.to_string());
    }
    Ok(())
}



#[tauri::command]
pub async fn add_project_download_task(dir: String, project_id: String, db_version : String) -> TaskState {
    if let Err(err) = fs::create_dir_all(String::from(dir.clone())) {
        return TaskState {
            message: err.to_string(),
            state: "failure".to_string(),
            percent: 0,
        };
    }

    add_task(Task { project_id: project_id.clone(), db_version: db_version.clone(), directory: dir.clone() });
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
        update_task(
            task.project_id.clone(),
            TaskState {
                state: "running".to_string(),
                percent: 10,
                message: "".to_string(),
            },
        );
        match download_project_to(task.project_id.clone(), task.db_version.clone(), task.directory.clone()).await {
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

