/** BRONX SCIENCE NHS 2018
CREATED BY ALEX CHEN
To be used to automatically generate Office Hours schedule based on responses. 
May be used as reference for future NHS VPs of Tech.*/

/** Gets array of numbers in string input. 
@param {string} input
*/
function getNums(input){ 
  var res = [];
  var tempArr = [];
  if (input.indexOf(",")>=0){ //multiple periods available
    tempArr = input.split(",");
    for (var r = 0; r < tempArr.length; r++){
      res.push(parseInt(tempArr[r].trim()));
    }
  }
  else if (input.length>0){ //1 period available
    res.push(parseInt(input.trim()));
  }
  return res;
}

/** Swaps rows of indices m and n in array input.
@param {Object[]} input
@param {Number} m
@param {Number} n
*/
function swap(input,m,n){ 
  var tempArr = input[m];
  input[m] = input[n];
  input[n] = tempArr;
}

/** Sorts 2D input array of people's indices, credits, and preferences and sorts such that people who need credits are first, then by location preference.
@param {Object[][]} input - 2D array of indices, credits, and location preferences.
*/
function creditPreferenceSort(input){
  //first sort by preference
  input = input.sort(function(a,b) {
    return a[2] - b[2];
  });
  
  //then sort by credit
  input = input.sort(function(a,b) { //sorts 2d aray by credits
    return a[1] - b[1];
  });
}

/** Runs script to retrieve data and generate schedule. */
function main() {
  var inputSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; // Get sheet of form responses.
  // Get form input data as 2d array of people's emails, first names, last names, periods (Mon.-Fri.), and preference
  var values = inputSheet.getDataRange().getValues();
  
  // See what days are included in this week's office hours
  var excludeMon = true;
  var excludeTues = true;
  var excludeWed = true;
  var excludeThurs = true;
  var excludeFri = true;
  for (var i = 0; i < values[0].length; i++){ // Iterate through the FIRST ROW and check for weekday names
    if (values[0][i].toLowerCase().indexOf("monday")>=0){
      excludeMon = false;
    }
    else if (values[0][i].toLowerCase().indexOf("tuesday")>=0){
      excludeTues = false;
    }
    else if (values[0][i].toLowerCase().indexOf("wednesday")>=0){
      excludeWed = false;
    }
    else if (values[0][i].toLowerCase().indexOf("thursday")>=0){
      excludeThurs = false;
    }
    else if (values[0][i].toLowerCase().indexOf("friday")>=0){
      excludeFri = false;
    }
  }
  
  // Get credit sheet values
  var juniorCreditSheet = SpreadsheetApp.openById("1kgcIOqlAVqofPiqqIkWTXGeQ5YWcTMW1Jk-gWjkVE1s").getSheets()[0]; 
  var juniorCredits = juniorCreditSheet.getDataRange().getValues();
  var seniorCreditSheet = SpreadsheetApp.openById("1yQkpeLWwiS8R4ngrkCvbF_tdFgK_PkgzbQPG3y_RbwA").getSheets()[0]; 
  var seniorCredits = seniorCreditSheet.getDataRange().getValues();
  
  // Look for the index of column that contains tutoring credits
  var JUNIORINDEX = -1;
  var SENIORINDEX = -1;
  for (var i = 0; i < juniorCredits[0].length; i++){ // Iterate through the FIRST ROW and check which row has the word "tutoring"
    if (juniorCredits[0][i].toLowerCase().indexOf("total tutoring")>=0){
      JUNIORINDEX = i;
      break;
    }
    if (i==juniorCredits[0].length-1){
      Logger.log("Could not find JUNIORINDEX.");
    }
  }
  for (var i = 0; i < seniorCredits[0].length; i++){ // Iterate through the FIRST ROW and check which row has the word "tutoring"
    if (seniorCredits[0][i].toLowerCase().indexOf("total tutoring")>=0){
      SENIORINDEX = i;
      break;
    }
    if (i==seniorCredits[0].length-1){
      Logger.log("Could not find SENIORINDEX.");
    }
  }
  if (JUNIORINDEX==-1){
    Logger.log("JUNIORINDEX was not found.");
  }
  if (SENIORINDEX==-1){
    Logger.log("SENIORINDEX was not found.");
  }
  
  var tempCredits = -1;
  var tempEmail = ""; //used to identify people
  var availability = [ //3d (4d?) array of 5 days, 9/10 periods per day, and people to fill inside
    [
      [],[],[],[],[],[],[],[],[],[] //only 9 periods for Mon and Fri; the last one should stay blank for Mon. and Fri.
    ],
    [
      [],[],[],[],[],[],[],[],[],[]
    ],
    [
      [],[],[],[],[],[],[],[],[],[]
    ],
    [
      [],[],[],[],[],[],[],[],[],[]
    ],
    [
      [],[],[],[],[],[],[],[],[],[]
    ]
  ]
  var tempAvailability = []; //1d temp array of person's periods free on a particular day
  var tempDay = -1; 
  var tempPeriodSwitch = []; //temp array when adjusting person's place in queue for other days of same period
  var tempPreference = "library";
  
  // Iterate through all the input values and add credits variable; also fill 3d array of indices of each person available for specific days 
  for (var i = values.length-1; i >= 1; i--){
    tempCredits = -1; 
    tempEmail = values[i][1].trim().toLowerCase();
    
    //tempPreference is 0 if library, 1 if no preference, and 2 if guidance
    if (values[i][10].trim().toLowerCase().indexOf("ibrary")>=0){
      tempPreference = 0;
    }
    else if (values[i][10].trim().toLowerCase().indexOf("preference")>=0){
      tempPreference = 1;
    }
    else if (values[i][10].trim().toLowerCase().indexOf("uidance")>=0){
      tempPreference = 2;
    }
    else{
      Logger.log("Could not find tempPreference");
    }
    
    // Search for person in junior and senior spreadsheets to find their current tutoring credits
    for (var j = 2; j < juniorCredits.length; j++){
      if (juniorCredits[j][2].trim().toLowerCase().indexOf(tempEmail)>=0){
        tempCredits = juniorCredits[j][JUNIORINDEX];
      }
    }
    
    // If they weren't in the junior spreadsheet, look in the senior spreadsheet
    if (tempCredits == -1){
      for (var j = 2; j < seniorCredits.length; j++){
        if (seniorCredits[j][2].trim().toLowerCase().indexOf(tempEmail)>=0){
          tempCredits = seniorCredits[j][SENIORINDEX];
        }
      }
    }
    
    // And if they weren't in the senior spreadsheet either, something is wrong
    if (tempCredits == -1){
      Logger.log('Person could not be found in junior nor senior spreadsheets, '+tempEmail+' and input index '+i);
    }
    
    // Add the credits into the person's array
    values[i].push(tempCredits);
    
    // Also add another variable: number of periods already assigned, which will start at 0
    values[i].push(0);
    
    // Now check person's availability
    for (var j = 4; j < 9; j++){
      tempAvailability = getNums(values[i][j]+""); //so like an array of 1, 5, 7
      tempDay = -1;
      if (values[0][j].toLowerCase().trim().indexOf("monday")>=0){
        tempDay = 0;
      }
      else if (values[0][j].toLowerCase().trim().indexOf("tuesday")>=0){
        tempDay = 1;
      }
      else if (values[0][j].toLowerCase().trim().indexOf("wednesday")>=0){
        tempDay = 2;
      }
      else if (values[0][j].toLowerCase().trim().indexOf("thursday")>=0){
        tempDay = 3;
      }
      else if (values[0][j].toLowerCase().trim().indexOf("friday")>=0){
        tempDay = 4;
      }
      else {
        Logger.log('Could not find day. Tempavailability is '+tempAvailability+'. i is '+i+' and j is '+j);
        continue;
      }
      for (var k = 0; k < tempAvailability.length; k++){ //change availability for each period
        availability[tempDay][tempAvailability[k]-1].push([parseInt(i),tempCredits, tempPreference]); //add person's index, credits, preference
      }
    }
    
  }
  
  // Now open up the office hours schedule spreadsheet and make a new sheet
  var temp = SpreadsheetApp.openById("1WRIPUuPEUJ8H4b8xOQeDgtQJ6cq8Q8fszp8AHz8OBhY");
  temp.setActiveSheet(temp.getSheetByName("Template"));
  var scheduleSheet = temp.duplicateActiveSheet();
  var periodDone = 0;
  var tempPeriodSignup = [];
  
  // Then create the schedule!
  for (var i = 0; i < 5; i++){ // Go each day of the week
    if (excludeMon&&i==0||excludeTues&&i==1||excludeWed&&i==2||excludeThurs&&i==3||excludeFri&&i==4){ //skip this day if not included in form
      continue;
    }
    for (var j = 0; j < 10; j++){ // Go each period
      if (i==0&&j==9||i==4&&j==9){ // Skip 10th period Mondays and Fridays
        break;
      }
      tempPeriodSignup = availability[i][j]; //so now we have 2d array of each signup (person's index, credits, and preference)
      periodDone = 0;
      //sort and swap by credits, then preference (then naturally whoever signed up first)
      creditPreferenceSort(tempPeriodSignup);

      for (var k = 0; k < tempPeriodSignup.length; k++){
        if (k>=4){
          break;
        }
        //add people into the spreadsheet based on their order in tempPeriodSignup
        scheduleSheet.getRange(3+(4*j)+k,2+i).setValue(values[tempPeriodSignup[k][0]][2]+" "+values[tempPeriodSignup[k][0]][3]);
        values[tempPeriodSignup[k][0]][values[2].length-1]++;

        //move the people to the back of the queue for OTHER DAYS of the same period
        for (var z = 0; z < 5; z++){
          if (z==i){
            continue;
          }
          tempPeriodSwitch = availability[z][j];
          //search for person's index in tempPeriodSwitch array
          for (var y = 0; y < tempPeriodSwitch.length; y++){
            if (tempPeriodSwitch[y][0]==tempPeriodSignup[k][0]){ //found them
              tempPeriodSwitch.push(tempPeriodSwitch.splice(y, 1)[0]); //move them to the back
            }
          }
        }
        
        //Remove them from availability for the rest of the day
        for (var z = 0; z < 5; z++){
            for (var y = 0; y < 10; y++){
              if (y==j){
                  continue;
              }
              if (z==i){
                tempPeriodSwitch = availability[z][y];
                for (var w = 0; w < tempPeriodSwitch.length; w++){
                  if (tempPeriodSwitch[w][0]==tempPeriodSignup[k][0]){ //found them
                    tempPeriodSwitch.splice(w,1); //remove them
                  }
                }
              }
            }
          }
        
        //if person has exceeded their preferred number of office hours, remove them from availability for the rest of the week
        if (values[tempPeriodSignup[k][0]][values[2].length-1]>=values[tempPeriodSignup[k][0]][values[2].length-3]){
          for (var z = 0; z < 5; z++){
            for (var y = 0; y < 10; y++){
              if (z==i&&y==j){
                  continue;
              }
              tempPeriodSwitch = availability[z][y];
              for (var w = 0; w < tempPeriodSwitch.length; w++){
                if (tempPeriodSwitch[w][0]==tempPeriodSignup[k][0]){ //found them
                  tempPeriodSwitch.splice(w,1); //remove them
                }
              }
            }
          }
        }
      }
      
      
      //if there's more people (as in, more than 4 in the array), add to guidance also
      if (tempPeriodSignup.length>4){
        for (var k = 4; k < tempPeriodSignup.length; k++){
          if (k>=8){
            break;
          }
          scheduleSheet.getRange(3+(4*j)+k-4,9+i).setValue(values[tempPeriodSignup[k][0]][2]+" "+values[tempPeriodSignup[k][0]][3]);
          values[tempPeriodSignup[k][0]][values[2].length-1]++;

          //move the people to the back of the queue for OTHER DAYS of the same period
          for (var z = 0; z < 5; z++){
            if (z==i){
              continue;
            }
            tempPeriodSwitch = availability[z][j];
            //search for person's index in tempPeriodSwitch array
            for (var y = 0; y < tempPeriodSwitch.length; y++){
              if (tempPeriodSwitch[y][0]==tempPeriodSignup[k][0]){ //found them
                tempPeriodSwitch.push(tempPeriodSwitch.splice(y, 1)[0]); //move them to the back
              }
            }
          }
        
          //if person has exceeded their preferred number of office hours, remove them from availability
          if (values[tempPeriodSignup[k][0]][values[2].length-1]>=values[tempPeriodSignup[k][0]][values[2].length-3]){
            for (var z = 0; z < 5; z++){
              for (var y = 0; y < 10; y++){
                if (z==i&&y==j){
                  continue;
                }
                tempPeriodSwitch = availability[z][y];
                for (var w = 0; w < tempPeriodSwitch.length; w++){
                  if (tempPeriodSwitch[w][0]==tempPeriodSignup[k][0]){ //found them
                    tempPeriodSwitch.splice(w,1); //remove them
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}


