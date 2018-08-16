### What for?
* It serve as a first demo project for my node journey. By transiting my self Java to Node, except 
reading tens of manning textbook and listen tedious course on Udemy which have even 27 hrs in length.
Nothing would be better to build a app by myself from ground up. 

* The problem trying to resolve here is the fragmentation of [Gov Parking API](https://data.gov.hk/en-data/dataset/hk-ogcio-st_div_04-carpark-info-vacancy).
As you may see this Endpoint do reply real-time parking spot vacancy data in real-time.    
However if you really take some time to twist around. You may notice their have few problems.    
first it's really slow, it takes like 2s up for a get call. The second one which is the most important one by the way is the fragmentation of data.   
It provides two options which is data || vacancy respectively. However by retrieving the vacancy data it would only
have ParkingID instead of the full name. How the hell I know what does parking id:10 stand for????? huh???? 
 
#### News

* This project is up on AWS at the moment for testing purpose, node application on EC2 and Postgre on RDS.
    * ec2-18-179-111-191.ap-northeast-1.compute.amazonaws.com:3000

#### Endpoint option
* Information is available via [swagger](https://app.swaggerhub.com/apis/HiuKwok/ParkingSlot/0.4.0)

#### Infrastructure 

* So by solving all above problem, this project is made. First DB is introduced to store all the vacancy data,   
which is the original API lack of. Endpoint would be open at the later stage of project to allow user to query historical vacancy data,   
which may help a bit for vacancy forcasting? If the parking appear to be full for every single weekend,    
why bother to check by your self? Unless feeling lucky. 

* As the project progress, more and more data would be avialble to user and    
also API key would be introduced. Again although it would end-up host on AWS  
for public access and demonstration purpose. 
But it's still a nature of demo. 

* Redis would also be introduced when this things start to scale up.....

* Setup:
    * Node end-point serve user request on REST manner
    * PostgreDB for back-end storage both API key usage && parking vacancy data.
    * background process would fetch update from Gov API and feed dat into DB periodically. 


#### Usage

#### Contribution guide
