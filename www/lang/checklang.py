from __future__ import absolute_import, division, print_function, unicode_literals
import sys
import simplejson as json
import os
import getopt

globGood=0
globBad=0
globBeautify=0
globOverwrite=0
globFile=""

# prints usage
def usage():
  print((
        'Usage: '+sys.argv[0]+'\n'
          ' called without arguments runs a check without any modifications\n'
          ' -h|--help: this help\n'
          ' -f|file <fname>: only processes that file\n'
          ' -b|--beautify: beautifies the json file\n'
          ' -o|--overwrite: when used with -b/--beautify overwrites the file without adding a pretty- prefix. Use with caution\n'
  ))


#beautifies a given file
def beautify(fi,ki, ek):
  global globOverwrite
  if globOverwrite:
    prefix=''
  else:
    prefix='pretty-'
  print("Beautifying %s, writing to %s" % (fi,prefix+fi))
  w = len (max(ki, key=len))
  pretty=[]
  for k in sorted(ki):
    if not k in ek:
        line = "    \"%s\"%s:\"%s\"" %(k,' '*(w-len(k)+1),ki[k])
        pretty.append(line)
    else:
        print ("Skipping ",k," as its an extra key")
  pFh=open(prefix+fi,"w")
  pFh.write('{\n')
  if sys.version_info >=(3, 0):
    pFh.write(",\n".join(pretty))
  else:
    pFh.write(",\n".join(pretty).encode('UTF-8'))
  pFh.write('\n}\n')
  pFh.close()

#Compares keys in language file

def compare(fname):
  
  beaut="no"
  global globGood, globBad,globOverwrite, globFile, globBeautify
  with open (i) as json_data:
      try:
        newKeys = json.load(json_data)
      except ValueError as err:
        print('could not parse %s, skipping! %s' %(fname, err))
        globBad+=1
        return
      json_data.close()
  missingKeys = set(origKeys.keys()) - set(newKeys.keys())
  extraKeys = set(newKeys.keys()) - set(origKeys.keys())
  if len(missingKeys)==0:
    status = "GOOD"
    globGood+=1
    if globBeautify and (globFile == fname or globFile == ""):
      beaut="YES"
  else:
    status = "ERROR"
    globBad+=1
    if globBeautify and (globFile == fname or globFile == ""):
      beaut="YES"
  print("\n-------Checking:%s:%s, beautify:%s---------" % (fname,status,beaut))
  print("master keys:%d, %s keys:%d" % (len(origKeys), i, len(newKeys)))
  if beaut=="YES":
      beautify(fname,newKeys, extraKeys)
  if len(missingKeys) > 0:
    print("Keys not present in :%s" %fname)
    for x in missingKeys:
      print("-->",x)
  if len(extraKeys) > 0:
    print("Extra keys present in :%s" %fname)
    for x in extraKeys:
      print("-->",x)
  


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

print("total keys in master language: ", len(origKeys))

#iterate through all languages, using -en as the master
for i in os.listdir(os.getcwd()):
  if  not i.endswith(".json") or not i.startswith("locale-"):
    #print "skipping ",i," as we will only process locale-*.json"
    continue
  else:
    if globFile == "" or globFile == i:
      compare(i)
    else:
      print("skipping ",i, " as its not ",globFile)

print("=================================================")
print("Good files:%d, Bad files:%d, Total files:%d" % (globGood, globBad, globGood+globBad))
print("=================================================\n")
      

  
