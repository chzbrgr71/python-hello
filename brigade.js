const { events, Job, Group } = require('brigadier')

events.on("push", (brigadeEvent, project) => {
    
    // setup variables
    var gitPayload = JSON.parse(brigadeEvent.payload)
    var brigConfig = new Map()
    brigConfig.set("acrServer", project.secrets.acrServer)
    brigConfig.set("acrUsername", project.secrets.acrUsername)
    brigConfig.set("acrPassword", project.secrets.acrPassword)
    brigConfig.set("azServicePrincipal", project.secrets.azServicePrincipal)
    brigConfig.set("azClientSecret", project.secrets.azClientSecret)
    brigConfig.set("azTenant", project.secrets.azTenant)
    brigConfig.set("image", "chzbrgr71/python-hello")
    brigConfig.set("gitSHA", brigadeEvent.revision.commit.substr(0,7))
    brigConfig.set("eventType", brigadeEvent.type)
    brigConfig.set("branch", getBranch(gitPayload))
    brigConfig.set("imageTag", `${brigConfig.get("branch")}-${brigConfig.get("gitSHA")}`)
    brigConfig.set("acrImage", `${brigConfig.get("acrServer")}/${brigConfig.get("image")}`)
    
    console.log(`==> gitHub webook (${brigConfig.get("branch")}) with commit ID ${brigConfig.get("gitSHA")}`)
    console.log(brigConfig.get("azServicePrincipal"))
    console.log(brigConfig.get("azClientSecret"))
    console.log(brigConfig.get("azTenant"))

    // setup brigade jobs
    var acrBuilder = new Job("job-runner-acr-builder")
    //var k8s = new Job("job-runner-k8s")
    acrBuildJobRunner(brigConfig, acrBuilder)
    //kubeJobRunner(brigConfig, k8s)
    
    var pipeline = new Group()
    pipeline.add(acrBuilder)
    //pipeline.add(k8s)
    if (brigConfig.get("branch") == "master") {
        pipeline.runEach()
    } else {
        console.log(`==> no jobs to run when not master`)
    }  
})

events.on("after", (event, proj) => {
    console.log("brigade pipeline finished successfully")    
})

function acrBuildJobRunner(config, d) {
    d.storage.enabled = false
    d.image = "chzbrgr71/azure-cli"
    d.privileged = true
    d.tasks = [
        "az acr list -o table",
        "cd /src",
        "ls -la"
        //`docker login ${config.get("acrServer")} -u ${config.get("acrUsername")} -p ${config.get("acrPassword")}`,
        //`docker build --build-arg BUILD_DATE='1/1/2017 5:00' --build-arg IMAGE_TAG_REF=${config.get("imageTag")} --build-arg VCS_REF=${config.get("gitSHA")} -t ${config.get("webImage")} .`,
        //`docker tag ${config.get("webImage")} ${config.get("webACRImage")}:${config.get("imageTag")}`,
        //`docker push ${config.get("webACRImage")}:${config.get("imageTag")}`
    ]
}

function kubeJobRunner (config, k) {
    k.storage.enabled = false
    k.image = "lachlanevenson/k8s-kubectl:v1.9.1"
    k.tasks = [
        `kubectl set image deployment/python-hello-deploy python-hello-cntnr=briaracrbuild.azurecr.io/chzbrgr71/briaracrbuild:${config.get("imageTag")}`
    ]
}

function getBranch (p) {
    if (p.ref) {
        return p.ref.substring(11)
    } else {
        return "PR"
    }
}
