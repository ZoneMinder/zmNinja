import json
import os

globGood=0
globBad=0

def compare (fname):
  global globGood, globBad
  with open (i) as json_data:
      newKeys = json.load(json_data)
      json_data.close()
  diffOrig = set(origKeys.keys()) - set(newKeys.keys())
  diffNew = set(newKeys.keys()) - set(origKeys.keys())
  if len(diffOrig)==0 and len (diffNew)==0:
    status = "GOOD"
    globGood+=1
  else:
    status = "ERROR"
    globBad+=1
  print "\n-------Checking:%s:%s---------" % (fname,status)
  print "master keys:%d, %s keys:%d" % (len(origKeys), i, len(newKeys))
  if len(diffOrig) > 0:
    print "Keys not present in :%s" %fname
    for x in diffOrig:
      print '-->',x
  if len(diffNew) > 0:
    print "Extra keys present in :%s" %fname
    for x in diffNew:
      print '-->',x
  


with open ('locale-en.json') as json_data:
  origKeys=json.load(json_data)
  json_data.close()

print "total keys in master language: ", len(origKeys)

for i in os.listdir(os.getcwd()):
  if i.endswith("-en.json") or not i.endswith(".json"):
    continue
  else:
    compare(i)
print "================================================="
print "Good files:%d, Bad files:%d, Total files:%d" % (globGood, globBad, globGood+globBad)
print "=================================================\n"
      

  
