### What for?

* It serve as a demo project for myself on my journey on Node.js and modern development tools && pipeline.
    * __Tech used:__
        * Node.js, Express, Postgre Client
        * Aws service: EC2, RDS
        * Development pipeline: Docker, Npm
        * Other: Swagger(API Doc), Github Issue tracking && milestone
        
* __About the project__
    * It periodically fetch real-time car parking vacancy from [Gov Parking API](https://data.gov.hk/en-data/dataset/hk-ogcio-st_div_04-carpark-info-vacancy), store in Postgre 
    and expose and API for access the data. 
        * In this way user would not just able to fetch the real-time vacancy, but also provide the ability of historical
        vacancy data retrieval. 

 
#### Other than Code 
* __API doc__ is available via [swagger](https://app.swaggerhub.com/apis/HiuKwok/ParkingSlot/0.4.0)
* The application itself is currently __hosted on__ [ec2](http://ec2-18-179-111-191.ap-northeast-1.compute.amazonaws.com:3000) with limited access at the moment for demonstration purpose
* Updated version of __docker images__ would be available once pipeline setup. 
  * In the mean static images is available [here](https://hub.docker.com/r/hiufkwok/hkparking-web-app/) 

#### Infrastructure && Discussion

* __Software pattern__
    * __ORM should be used__ as the project progress, it's nearly impossible to have SQL to serve all different of data retrieval.
        * Ease of maintainability

* __Hardware && Performance matrix__ 
    * At the moment both App && Postgre are hosted on AWS EC2(t2.micro) and RDS(db.t2.micro). 
    * By simply J-meter loading test, App aim be able to handle __~200 Requests on /carpark/:id per second__. 
    * However the CPU usage on both instance are having a distinct different which DB side are full loaded (100%), but Node side are mostly idle(~2%).
        * So the __bottleneck is on DB side__. Further investagation can be done is varies way:
            * SQL stmt optimization? || Introduce ORM?
            * Enable index on certain field on table? (Currently none of it is on)
            * DB pool size?
        * Overall speaking the performance would be so much room to improve once the bottleneck is solved 


#### Further direction
* __Redis__ instance can be introduce to improve IO.
* API Key && __OAuth implmentation__
* Completed pipeline setup. Git -> Jerkin -> Docker -> AWS -> Auto scaling 
* __Separate work thread to handle background process__, to avoid blocking epxress.js working.


#### Usage
* Docker image for both DB and node app would be available soon.......

#### Contribution guide
* Any discussion are welcome, just drop words by raising a issue. 
