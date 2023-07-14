var getJSON = (line) => {
    let start = line.indexOf("{")
   // console.log(line)
    let jsonData = JSON.parse(line.substr(start -1))
    return convertWork(jsonData.work)
}

var convertWork = (work) => {
    let retData = {
        initial : work.initial,
        observers : work.observers,
        title_picture_url : work.title_picture_url,
        picture_url : work.picture_url,
    }
    let baseURL = getBaseURL(work)
    retData['base_url'] = baseURL
    console.log(baseURL)
    retData['panorama'] = parsePanorama(work, baseURL)
    let model = parseModel(work,baseURL)
    retData['model'] = model
    return retData
}

var getBaseURL = (work) => {
    let parts = work.panorama.list[0].back.split('images')
    return parts[0]
}

var parsePanorama = (work, baseURL) => {
    let list = work.panorama.list
    let newList = []
    for(var i in list) {
        newList.push({
            back : list[i].back.substr(baseURL.length),
            front : list[i].front.substr(baseURL.length),
            left : list[i].left.substr(baseURL.length),
            right : list[i].right.substr(baseURL.length),
            down : list[i].down.substr(baseURL.length),
            up : list[i].up.substr(baseURL.length),
            derived_id : list[i].derived_id,
            index : list[i].index,
        })
    }
   return {
      list : newList, count : newList.length
   }
}

var parseModel = (work, baseURL) => {
    let model = work.model
    console.log(model)
    let material_textures = []
    for(var i in model.material_textures) {
        material_textures.push(model.material_textures[i].substr(model.material_base_url.length))
    }
    console.log(material_textures)
    return {
        'file_url' : work.model.file_url.substr(baseURL.length),
        material_textures : material_textures,
        material_base_url : work.model.material_base_url.substr(baseURL.length),
        type : work.model.type,
    }
}


var getWorkJSONFromJSCodeList = (list) => {
    for(var i in list) {
        console.log(list[i])
        if(list[i].indexOf('work_code') > -1) {
            let parts = list[i].trim().split(';;');
            for(var j in parts) {
                if(parts[j].indexOf('__module__data') > -1) {
                    return getJSON(parts[j])
                }
            }
        }
    }
}

export default {
    getWorkJSONFromJSCodeList
}
export {
    getWorkJSONFromJSCodeList
}