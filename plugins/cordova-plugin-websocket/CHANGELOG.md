## Change Log
#### 0.11.0
* permessage-deflate support  
* deleted unused code (further shrank about 20%)  
* performance improvement (further about 15% to 25% faster than previous versions)  

#### 0.10.0
* permessage-deflate support (experimental)  
* fixed multiple subprotocol bug  
* improved finalization  
* deleted unused code (shrank about 20%)  

#### 0.9.2
* fixed lack of trailing zeros (0x00) when receiving binary (thanks to @lemoncola)  

#### 0.9.1
* updated only documents  

#### 0.9.0
* integrated with jetty-8.1.17.v20150415  
* performance improvement (about 10% to 25% faster than previous versions)  
* added `agent` option  
* changed default value of `origin` option  
* restored `maxTextMessageSize`/`maxBinaryMessageSize` options  
* Crosswalk support  
* Android 2.2 (Froyo) support end  
* refactor  

#### 0.8.3
* fixed that difference between packages and directories structure (thanks to @digigm)  

#### 0.8.2
* fixed the constructor error on 4.4 and later (thanks to @digigm)  

#### 0.8.1
* fixed the frame aggregation error (thanks to @Atsyn)  
* fixed the binary transmission for the case of using the plugin on 4.4 and later  

#### 0.8.0
* performance improvement (about 5% to 15% faster than previous versions)  
* deployed source of Jetty directly (instead the jar file)  
* abolished `maxTextMessageSize`/`maxBinaryMessageSize` options  
* added `override` option  
* refactor  

#### 0.7.0
* resolved the issue of SSL on 4.0 and 2.3 (thanks to @agalazis and koush/AndroidAsync)  

#### 0.6.3
* fixed a bug of a receiving binary size  

#### 0.6.2a
* limit installation target to Android (thanks to @peli44)  

#### 0.6.2
* updated Jetty WebSocket library  

#### 0.6.1
* added escaping of special characters (thanks to @odbol)  

#### 0.6.0
* cookie support (thanks to @ericfong)  
* removed a second argument from the send() method  

#### 0.5.2
* clobbered buggy websockets on 4.3 or lower (thanks to @rpastorvargas and @punj)  
* bug fix  

#### 0.5.1
* bug fix  

#### 0.5.0
* change the way to set plugin options  
* multiple subprotocol support  
* readyState property support (thanks to @jrpereirajr)  

#### 0.4.0
* Cordova/Phonegap 3 support  
* binary support  
* event listener support  
* more compliant with the WebSocket API requirements  
* license change from MIT to Apache v2.0  

#### 0.3.2
* bug fix  

#### 0.3.1
* bug fix  

#### 0.3.0
* `origin` support (thanks to @rgillan)  

#### 0.2.0
* comply with the WebSocket API requirements  

#### 0.1.0
* first release  
