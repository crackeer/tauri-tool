use reqwest;
use std::fs::{File, self};
use std::io::Write;
use std::path::Path;
use base64::{Engine as _, engine::general_purpose};
use rust_embed::{RustEmbed};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

#[derive(RustEmbed)]
#[folder = "static/"]
struct Asset;


pub struct Task {
    dir: String,
    state : String,
    percent: usize,
    message: String,
}

lazy_static! {
    pub static ref TASK_LIST: Arc<Mutex<Vec<Task>>> = Arc::new(Mutex::new(Vec::new()));
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


#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Work {
    base_url: String,
    initial: Initial,
    model: Model,
    observers: Vec<Observer>,
    panorama: Panorama,
    picture_url: String,
    title_picture_url: String,
    vr_code: String,
    vr_type: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Initial {
    flag_position: Vec<Option<serde_json::Value>>,
    fov: i64,
    heading: i64,
    latitude: f64,
    longitude: f64,
    pano: i64,
    pano_index: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Model {
    file_url: String,
    material_base_url: String,
    material_textures: Vec<String>,
    modify_time: String,
    #[serde(rename = "type")]
    model_type: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Observer {
    accessible_nodes: Vec<i64>,
    floor_index: i64,
    index: i64,
    offset_point_count: i64,
    position: Vec<f64>,
    quaternion: Quaternion,
    standing_position: Vec<f64>,
    visible_nodes: Vec<i64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Quaternion {
    w: f64,
    x: f64,
    y: f64,
    z: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Panorama {
    count: i64,
    list: Vec<PanoramaItem>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PanoramaItem {
    back: String,
    derived_id: i64,
    down: String,
    front: String,
    index: i64,
    left: String,
    right: String,
    tiles: Vec<i64>,
    up: String,
}

impl Work {
    fn with_base_url(&self, suffix: &str) -> String {
        let mut full_url = String::from(&self.base_url);
        full_url.push_str(suffix);
        return full_url;
    }
    fn with_model_base_url(&self, suffix: &str) -> String {
        let mut full_url = String::from(&self.model.material_base_url);
        full_url.push_str(suffix);
        return full_url;
    }
    fn get_download_list(&self) -> Vec<(String, String)> {
        let mut download: Vec<(String, String)> = Vec::new();
        download.push((self.picture_url.clone(), String::from("picture.jpg")));
        download.push((self.title_picture_url.clone(), String::from("title_picture.jpg")));
        for item in self.panorama.list.iter() {
            download.push((self.with_base_url(&item.right), item.right.clone()));
            download.push((self.with_base_url(&item.left), item.left.clone()));
            download.push((self.with_base_url(&item.front), item.front.clone()));
            download.push((self.with_base_url(&item.back), item.back.clone()));
            download.push((self.with_base_url(&item.up), item.up.clone()));
            download.push((self.with_base_url(&item.down), item.down.clone()));
        }
        download.push((self.with_base_url(&self.model.file_url), self.model.file_url.clone()));
        for item in self.model.material_textures.iter() {
            download.push((self.with_base_url(&self.with_model_base_url(&item)), self.with_model_base_url(&item)))
        }
        return download;
    }
    fn get_jsonp_work(&self) -> String {
        let mut work = self.clone();
        let mut index :usize  = 0;
        work.picture_url = format!("picture.jpg.{}.jsonp", index);
        index = index + 1;
        work.title_picture_url =  format!("title_picture.jpg.{}.jsonp", index);
        for x in 0..self.panorama.list.len() {
            index = index + 1;
            work.panorama.list[x].right = format!("{}.{}.jsonp",  work.panorama.list[x].right , index);
            index = index + 1;
            work.panorama.list[x].left = format!("{}.{}.jsonp",  work.panorama.list[x].left , index);
            index = index + 1;
            work.panorama.list[x].front = format!("{}.{}.jsonp",  work.panorama.list[x].front , index);
            index = index + 1;
            work.panorama.list[x].back = format!("{}.{}.jsonp",  work.panorama.list[x].back , index);
            index = index + 1;
            work.panorama.list[x].up = format!("{}.{}.jsonp",  work.panorama.list[x].up , index);
            index = index + 1;
            work.panorama.list[x].down = format!("{}.{}.jsonp",  work.panorama.list[x].down , index);
        }
        index = index + 1;
        work.model.file_url = format!("{}.{}.jsonp", work.model.file_url, index);
        for x in 0..work.model.material_textures.len() {
            index = index+1;
            work.model.material_textures[x] = format!("{}.{}.jsonp", work.model.material_textures[x], index);
        }
        serde_json::to_string(&work).unwrap()
    }
}


pub async fn download_work_to(work: &Work, path: &Path) -> Result<(), String> {
    let download: Vec<(String, String)> = work.get_download_list();

    for (index, item) in download.iter().enumerate() {
        download_file(item.0.clone(), path.join(item.1.clone()).to_str().unwrap(), index).await?;
    }
    let work_json =  work.get_jsonp_work();
    let mut file = File::create(path.join(&"work.js").to_str().unwrap()).unwrap();
    if let Err(err) = file.write_all("var workJSON = ".as_bytes()) {
        return Err(err.to_string());
    }
    if let Err(err) = file.write_all(work_json.as_bytes()) {
        return Err(err.to_string());
    }
    for f in Asset::iter() {
        let a = Asset::get(f.as_ref()).unwrap();
        if let Err(err) = fs::write(path.join(f.as_ref()), a.data.as_ref()) {
            return Err(format!("write static file `{}` error: {}", f.as_ref(), err.to_string()));
        }
    }

    Ok(())
}

async fn download_file(url: String, dest: &str, index : usize) -> Result<(), String> {
    //let resp = reqwest::blocking::get(url);
    let client = reqwest::Client::new();
    let builder = client.get(url);
    let result = builder.send().await;

    if let Err(err) = result {
        return Err(err.to_string());
    }
    let response = result.unwrap();
    let path: &Path = Path::new(dest);
    if let Err(err) = std::fs::create_dir_all(path.parent().unwrap()) {
        return Err(err.to_string());
    }
    let mut real_dest = String::from(dest);
    real_dest.push_str(&format!(".{}.jsonp", index));
    let res = File::create(real_dest);
    if res.is_err() {
        return Ok(());
    }
    let mut buffer = res.unwrap();
    let mut content_type = "";
    let header = response.headers().clone();
    if let Some(val) = header.get("Content-Type") {
        content_type = val.to_str().unwrap();
    }
    let bytes = response.bytes().await;
    let base64_data = generate_jsonp_content(&content_type, &bytes.unwrap().to_vec(), index);
    if let Err(err) = buffer.write_all(&base64_data.as_bytes()) {
        return Err(err.to_string());
    }
    Ok(())
}


const IMAGE_JPEG: &str = "image/jpeg";
const IMAGE_JPG: &str = "image/jpg";
const IMAGE_PNG : &str = "image/png";

fn generate_jsonp_content(content_type: &str, input : &[u8], hash_code : usize) -> String {
    match content_type {
        IMAGE_JPEG | IMAGE_JPG => format!("window[\"jsonp_{}\"] && window[\"jsonp_{}\"](\"data:image/jpeg;base64,{}\")", hash_code, hash_code, general_purpose::STANDARD.encode(input)),
        IMAGE_PNG => format!("window[\"jsonp_{}\"] && window[\"jsonp_{}\"](\"data:image/png;base64,{}\")", hash_code, hash_code, general_purpose::STANDARD.encode(input)),
        _ => format!("window['jsonp_{}'] && window['jsonp_{}'](\"data:application/octet-stream;base64,{}\")", hash_code, hash_code, general_purpose::STANDARD.encode(input)),
    }
}


#[tauri::command]
pub async fn exec_download_work(dir: String, work_json: String) -> String { 
    if let Err(err) = fs::create_dir_all(String::from(dir.clone())) {
        return String::from(err.to_string());
    }
    let path = Path::new(&dir);
    fs::write(path.join(&"input.json").to_str().unwrap(), work_json.as_bytes());

    let data : Option<Work> = match serde_json::from_str(&work_json) {
        Ok(val) => Some(val),
        _ => None,
    };
    if data.is_none() {
        return String::from("json decode work_json error");
    }
    download_work_to(&data.unwrap(), path.join("preview").as_path()).await;
    String::from("ok")
}


fn download_work_from_task_list() {
    if TASK_LIST.lock().unwrap().len > 0 {
        return
    }
    TASK_LIST.lock().unwrap().

}