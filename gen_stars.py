import csv, json, math
M=[[-0.0548755604,-0.8734370902,-0.4838350155],[0.4941094279,-0.4448296300,0.7469822445],[-0.8676661490,-0.1980763734,0.4559837762]]
LY=3.26156
def gal(x,y,z): return [sum(M[i][j]*v for j,v in enumerate((x,y,z))) for i in range(3)]
rename={'Rigil Kentaurus':'Alpha Centauri','Toliman':'Alpha Centauri','Proxima Centauri':'Alpha Centauri','Ran':'Epsilon Eridani','Keid':'40 Eridani','Achird':'Eta Cassiopeiae','Alsafi':'Sigma Draconis','Guniibuu':'36 Ophiuchi','Gl 65A':'Luyten 726-8','82 G. Eri':'82 Eridani','Struve 2398 A':'Struve 2398','Struve 2398 B':'Struve 2398','Alula Australis B':'Alula Australis','Guniibuu B':'36 Ophiuchi'}
bfname={'52TauCet':'Tau Ceti','EpsInd':'Epsilon Indi','61Cyg':'61 Cygni','70Oph':'70 Ophiuchi','DelPav':'Delta Pavonis','BetHyi':'Beta Hydri','XiBoo':'Xi Bootis','BetCVn':'Chara'}
glname={'Gl 581':'Gliese 581','Gl 667C':'Gliese 667','Gl 667A':'Gliese 667','Gl 876':'Gliese 876','Gl 687':'Gliese 687','Gl 682':'Gliese 682','GJ 1061':'Gliese 1061','Gl 54.1':'YZ Ceti','GJ 1002':'Gliese 1002','Gl 65A':'Luyten 726-8','Gl 65B':'Luyten 726-8','Gl 832':'Gliese 832','Gl 674':'Gliese 674','Gl 436':'Gliese 436','Gl 1214':'Gliese 1214','Gl 849':'Gliese 849','Gl 433':'Gliese 433','Gl 176':'Gliese 176','Gl 180':'Gliese 180','Gl 229':'Gliese 229','Gl 86':'Gliese 86'}
recs=[]
with open('/home/claude/preview/data/hyg.csv') as f:
    for r in csv.DictReader(f):
        try: d=float(r['dist'])
        except: continue
        if r['id']=='0' or d<=0 or d>=100000: continue
        ly=d*LY
        if ly>37.5: continue
        g=gal(float(r['x'])*LY,float(r['y'])*LY,float(r['z'])*LY)
        name=r['proper'] or ''
        bf=r['bf'].replace(' ','')
        for k,v in bfname.items():
            if bf.endswith(k) or bf==k: name=v
        if r['gl'] in glname: name=glname[r['gl']]
        name=rename.get(name,name)
        recs.append({'n':name,'g':g,'ly':ly,'sp':(r['spect'] or 'M').strip(),'abs':float(r['absmag'] or 12),'gl':r['gl']})
def add(name,ra_h,dec,ly,sp):
    ra=ra_h*15*math.pi/180; de=dec*math.pi/180
    x,y,z=ly*math.cos(de)*math.cos(ra), ly*math.cos(de)*math.sin(ra), ly*math.sin(de)
    recs.append({'n':name,'g':gal(x,y,z),'ly':ly,'sp':sp,'abs':17,'gl':''})
add("Teegarden's Star",2.88358,16.8813,12.5,'M7V')
add('TRAPPIST-1',23.10816,-5.0414,40.66,'M8V')
# merge into systems (brightest first)
recs.sort(key=lambda s:s['abs'])
syst=[]
for s in recs:
    for t in syst:
        if math.dist(t['g'],s['g'])<0.4:
            t['count']+=1
            if not t['n'] and s['n']: t['n']=s['n']
            break
    else:
        s=dict(s); s['count']=1; syst.append(s)
drop={'p Eridani','268 G. Cet','96 G. Psc','Gar','Rana','Tabit','Añañuca','Noquisi'}
def pick(radius):
    out=[]
    for s in syst:
        ly=s['ly']
        if s['n'] in ('Arcturus','TRAPPIST-1') and radius>=35:
            k=34.6/ly; s2=dict(s); s2['g']=[v*k for v in s['g']]; s2['ly']=34.6; s2['nudged']=round(ly,1); out.append(s2); continue
        if ly<=radius and s['n'] and s['n'] not in drop: out.append(s)
    return out
std=pick(26); lng=pick(35)
# fill long with brightest unnamed dwarfs 26-35 ly to reach ~80
extra=[s for s in syst if not s['n'] and 26<s['ly']<=35 and s['gl']]
extra.sort(key=lambda s:s['abs'])
for s in extra[:max(0,80-len(lng))]:
    s=dict(s); s['n']=s['gl'].replace('Gl ','Gliese ').replace('GJ ','Gliese '); lng.append(s)
# add a few unnamed nearby dwarfs to standard for realism (named by catalogue number)
extra2=[s for s in syst if not s['n'] and s['ly']<=26 and s['gl']]
extra2.sort(key=lambda s:s['ly'])
for s in extra2[:6]:
    s=dict(s); s['n']=s['gl'].replace('Gl ','Gliese ').replace('GJ ','Gliese '); std.append(s)
def out(lst):
    res=[{'n':'Sun','x':0,'y':0,'z':0,'sp':'G2V','c':1,'ly':0}]
    seen={'Sun'}
    for s in sorted(lst,key=lambda s:s['ly']):
        if s['n'] in seen: continue
        seen.add(s['n'])
        e={'n':s['n'],'x':round(s['g'][0],2),'y':round(s['g'][1],2),'z':round(s['g'][2],2),'sp':s['sp'][:6],'c':s['count'],'ly':round(s['ly'],1)}
        if s.get('nudged'): e['real']=s['nudged']
        res.append(e)
    return res
S,L=out(std),out(lng)
print('standard',len(S),'long',len(L))
print([s['n'] for s in S])
# distant beacons for the edge
want=['Betelgeuse','Rigel','Polaris','Deneb','Capella','Aldebaran','Antares','Canopus','Spica','Regulus','Castor','Achernar']
far=[]
with open('/home/claude/preview/data/hyg.csv') as f:
    for r in csv.DictReader(f):
        if r['proper'] in want and r['proper'] not in [x['n'] for x in far]:
            g=gal(float(r['x']),float(r['y']),float(r['z'])); L2=math.sqrt(sum(v*v for v in g))
            far.append({'n':r['proper'],'d':[round(v/L2,3) for v in g],'ly':round(float(r['dist'])*LY)})
open('src/stars_data.js','w').write('"use strict";\nconst STARS_STD='+json.dumps(S)+';\nconst STARS_LONG='+json.dumps(L)+';\nconst FAR_STARS='+json.dumps(far)+';\n')
