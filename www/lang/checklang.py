#!/usr/bin/env python
import json
import os
import getopt
import sys

globGood=0
globBad=0
globBeautify=0
globOverwrite=0
globFile=""

# prints usage
def usage():
  print (
        'Usage: '+sys.argv[0]+'\n'
          ' -h|--help: this help\n'
          ' -f|file <fname>: only processes that file\n'
          ' -b|--beautify: beautifies the json file\n'
          ' -o|--overwrite: when used with -b/--beautify overwrites the file without adding a pretty- prefix. Use with caution\n'
  )


#beautifies a given file
def beautify(fi,ki):
  global globOverwrite
  if globOverwrite:
    prefix=''
  else:
    prefix='pretty-'
  print "Beautifying %s, writing to %s" % (fi,prefix+fi)
  w = len (max(ki, key=len))
  pretty=[]
  for k in sorted(ki):
    line = "    \"%s\"%s:\"%s\"" %(k,' '*(w-len(k)+1),ki[k])
    pretty.append(line)
  pFh=open  (prefix+fi,"w")
  pFh.write("{\n")
  pFh.write(',\n'.join(pretty).encode('utf-8'))
  pFh.write("\n}\n")
  pFh.close()

#Compares keys in language file
def compare (fname):
  beaut="no"
  global globGood, globBad,globOverwrite, globFile, globBeautify
  with open (i) as json_data:
      try:
        newKeys = json.load(json_data)
      except ValueError:
        print 'could not parse %s, skipping!' %fname
        globBad+=1
        return
      json_data.close()
  diffOrig = set(origKeys.keys()) - set(newKeys.keys())
  diffNew = set(newKeys.keys()) - set(origKeys.keys())
  if len(diffOrig)==0 and len (diffNew)==0:
    status = "GOOD"
    globGood+=1
    if globBeautify and globFile == fname or globFile == "":
      beaut="YES"
  else:
    status = "ERROR"
    globBad+=1
  print "\n-------Checking:%s:%s, beautify:%s---------" % (fname,status,beaut)
  print "master keys:%d, %s keys:%d" % (len(origKeys), i, len(newKeys))
  if beaut=="YES":
      beautify(fname,newKeys)
  if len(diffOrig) > 0:
    print "Keys not present in :%s" %fname
    for x in diffOrig:
      print '-->',x
  if len(diffNew) > 0:
    print "Extra keys present in :%s" %fname
    for x in diffNew:
      print '-->',x
  


#MAIN
try:
  myopts,args=getopt.getopt(sys.argv[1:],"f:hob",["file=","help","overwrite","beautify"])
except getopt.GetoptError as err:
  print (err)
  usage()
  sys.exit(2)

for o,a in myopts:
  if o in ("-h","--help"):
    usage()
    sys.exit()
  elif o in ("-b","--beautify"):
    globBeautify=1 
  elif o in ("-o","--overwrite"):
    globOverwrite=1
  elif o in ("-f","--file"):
    globFile=a

with open ('locale-en.json') as json_data:
  origKeys=json.load(json_data)
  json_data.close()

print "total keys in master language: ", len(origKeys)

#iterate through all languages, using -en as the master
for i in os.listdir(os.getcwd()):
  if  not i.endswith(".json") or not i.startswith("locale-"):
    #print "skipping ",i," as we will only process locale-*.json"
    continue
  else:
    if globFile == "" or globFile == i:
      compare(i)
    else:
      print "skipping ",i, " as its not ",globFile

print "================================================="
print "Good files:%d, Bad files:%d, Total files:%d" % (globGood, globBad, globGood+globBad)
print "=================================================\n"
      

  
