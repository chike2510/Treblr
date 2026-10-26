# Generates src/engine/realArtists.js from real_listeners.json (kworb.net snapshot, 2026-10-26).
import json, sys
src = sys.argv[1]
real = {x['name']: x['monthlyListeners'] for x in json.load(open(src))}
# name, country, genres, styles, market boosts (where the act is genuinely big), estimate (only if absent from list)
R = [
 ("Bruno Mars","US","pop,rnb","party,romance",{"US":1.4,"UK":1.2,"BR":1.3,"MX":1.2,"IN":1.2}),
 ("Rihanna","BB","pop,rnb","party,romance",{"US":1.3,"UK":1.3,"FR":1.3}),
 ("The Weeknd","CA","rnb,pop","moody,party",{"US":1.3,"CA":1.6,"BR":1.2,"FR":1.2}),
 ("Justin Bieber","CA","pop","romance,party",{"CA":1.6,"US":1.2}),
 ("Taylor Swift","US","pop,country","romance,ballad",{"US":1.6,"UK":1.3,"AU":1.4,"CA":1.3}),
 ("Lady Gaga","US","pop,electronic","party,moody",{"US":1.2,"UK":1.2,"BR":1.3}),
 ("Drake","CA","hiphop,rnb","street,moody",{"US":1.4,"CA":1.8,"UK":1.2}),
 ("Coldplay","UK","rock,pop","anthem,ballad",{"UK":1.4,"MX":1.3,"IN":1.3,"DE":1.2}),
 ("Ariana Grande","US","pop,rnb","romance,party",{"US":1.3,"UK":1.2,"PH":1.2}),
 ("Bad Bunny","PR","reggaeton,latin","latin,party",{"MX":2.0,"US":1.3,"BR":1.0}),
 ("Shakira","CO","latin,pop","latin,party",{"MX":1.6,"BR":1.2,"FR":1.2}),
 ("Katy Perry","US","pop","party,romance",{"US":1.1,"UK":1.1}),
 ("David Guetta","FR","electronic,pop","edm,party",{"FR":1.8,"DE":1.4,"UK":1.2}),
 ("Billie Eilish","US","pop,alternative","moody,ballad",{"US":1.3,"UK":1.3,"AU":1.3}),
 ("Ed Sheeran","UK","pop","romance,ballad",{"UK":1.8,"IN":1.3,"DE":1.2,"AU":1.2}),
 ("Dua Lipa","UK","pop,electronic","party,edm",{"UK":1.6,"DE":1.2,"FR":1.2}),
 ("Calvin Harris","UK","electronic,pop","edm,party",{"UK":1.5,"US":1.1}),
 ("Eminem","US","hiphop","street,anthem",{"US":1.3,"DE":1.4,"UK":1.2}),
 ("Lana Del Rey","US","alternative,pop","moody,ballad",{"US":1.2,"UK":1.2,"FR":1.2}),
 ("Olivia Rodrigo","US","pop,rock","romance,anthem",{"US":1.5,"UK":1.3,"AU":1.4,"CA":1.3}),
 ("J Balvin","CO","reggaeton,latin","latin,party",{"MX":1.6}),
 ("SZA","US","rnb","moody,romance",{"US":1.6,"UK":1.2,"CA":1.2}),
 ("Kendrick Lamar","US","hiphop","street,anthem",{"US":1.7,"CA":1.4,"UK":1.2}),
 ("Sia","AU","pop","anthem,ballad",{"AU":1.4,"BR":1.2,"IN":1.2}),
 ("KAROL G","CO","reggaeton,latin","latin,party",{"MX":1.8,"US":1.1}),
 ("Post Malone","US","hiphop,pop,country","moody,anthem",{"US":1.4,"CA":1.3}),
 ("Beyoncé","US","rnb,pop,country","anthem,romance",{"US":1.4,"UK":1.2}),
 ("Harry Styles","UK","pop,rock","romance,anthem",{"UK":1.5,"US":1.2}),
 ("Tame Impala","AU","indie,alternative","dreamy,moody",{"AU":1.6,"US":1.1}),
 ("Travis Scott","US","hiphop","street,moody",{"US":1.4,"FR":1.3,"DE":1.2}),
 ("Miley Cyrus","US","pop,rock","anthem,romance",{"US":1.2}),
 ("Doja Cat","US","hiphop,pop","party,street",{"US":1.2,"UK":1.1}),
 ("Arctic Monkeys","UK","rock,indie","rock,moody",{"UK":1.6,"MX":1.3,"BR":1.2}),
 ("Linkin Park","US","rock,metal","rock,anthem",{"DE":1.4,"US":1.2,"JP":1.2}),
 ("Shreya Ghoshal","IN","pop","ballad,romance",{"IN":7.0}),
 ("Arijit Singh","IN","pop","ballad,romance",{"IN":8.0}),
 ("Sabrina Carpenter","US","pop","romance,party",{"US":1.4,"UK":1.4,"AU":1.3}),
 ("Rauw Alejandro","PR","reggaeton,latin","latin,party",{"MX":1.6}),
 ("Imagine Dragons","US","rock,pop","anthem,rock",{"US":1.2,"DE":1.3,"BR":1.2}),
 ("Pritam","IN","pop","ballad,party",{"IN":7.0}),
 ("Tate McRae","CA","pop","romance,party",{"CA":1.6,"US":1.2,"AU":1.3}),
 ("Peso Pluma","MX","latin","corrido,street",{"MX":3.0,"US":1.3}),
 ("A.R. Rahman","IN","pop","ballad,anthem",{"IN":6.0}),
 ("Burna Boy","NG","afrobeats","afro,party",{"NG":3.0,"UK":1.8,"FR":1.4,"US":1.1}),
 ("Rema","NG","afrobeats","afro,romance",{"NG":2.6,"IN":1.4,"FR":1.3,"UK":1.3}),
 ("Hozier","IE","indie,rock","ballad,moody",{"UK":1.3,"US":1.1}),
 ("RAYE","UK","pop,rnb","moody,romance",{"UK":1.8}),
 ("Daniel Caesar","CA","rnb","romance,moody",{"CA":1.5,"US":1.2}),
 ("Grupo Frontera","MX","latin","corrido,romance",{"MX":3.0,"US":1.1}),
 ("Feid","CO","reggaeton","latin,romance",{"MX":1.5}),
 ("Anitta","BR","latin,pop","party,latin",{"BR":3.0,"MX":1.1}),
 ("Tems","NG","afrobeats,rnb","afro,moody",{"NG":2.6,"UK":1.5,"US":1.2}),
 ("Metallica","US","metal,rock","metal,anthem",{"DE":1.6,"US":1.1,"BR":1.2}),
 ("Charli xcx","UK","pop,electronic","party,edm",{"UK":1.6}),
 ("Morgan Wallen","US","country","country,party",{"US":2.0,"CA":1.6,"AU":1.3}),
 ("BTS","KR","kpop","kpop,anthem",{"KR":3.0,"JP":2.4,"US":1.2,"IN":1.2}),
 ("Zach Bryan","US","country,indie","country,ballad",{"US":1.8,"CA":1.6,"AU":1.3}),
 ("Fred again..","UK","electronic","edm,moody",{"UK":1.8,"AU":1.3}),
 ("ROSÉ","KR","kpop,pop","kpop,romance",{"KR":2.6,"JP":1.8,"US":1.1}),
 ("ROSALÍA","ES","latin,pop","latin,moody",{"MX":1.3,"FR":1.2}),
 ("Alan Walker","NO","electronic","edm,anthem",{"IN":1.5,"DE":1.3}),
 ("Badshah","IN","hiphop,pop","party,street",{"IN":6.0}),
 ("Chris Stapleton","US","country,rock","country,ballad",{"US":1.7,"CA":1.4}),
 ("Luke Combs","US","country","country,anthem",{"US":1.8,"CA":1.5,"AU":1.3}),
 ("Tyla","ZA","afrobeats,pop","afro,party",{"NG":2.0,"UK":1.5,"US":1.2}),
 ("Alok","BR","electronic","edm,party",{"BR":3.0}),
 ("Central Cee","UK","hiphop","street",{"UK":2.0,"FR":1.4,"DE":1.3}),
 ("Troye Sivan","AU","pop,electronic","party,dreamy",{"AU":1.6}),
 ("Laufey","IS","jazz,pop","jazzy,ballad",{"US":1.2,"PH":1.3,"KR":1.2}),
 ("Stromae","BE","pop,electronic","moody,edm",{"FR":3.0}),
 ("Ayra Starr","NG","afrobeats","afro,romance",{"NG":2.8,"UK":1.3,"FR":1.3}),
 ("BLACKPINK","KR","kpop","kpop,party",{"KR":2.6,"JP":1.8,"IN":1.2}),
 ("Diljit Dosanjh","IN","pop,hiphop","party,romance",{"IN":5.5,"CA":1.6,"UK":1.3}),
 ("Aya Nakamura","FR","afrobeats,pop","afro,romance",{"FR":3.2}),
 ("Wizkid","NG","afrobeats","afro,romance",{"NG":2.8,"UK":1.4}),
 ("AP Dhillon","IN","pop,hiphop","romance,street",{"IN":5.0,"CA":1.6}),
 ("Henrique & Juliano","BR","country","country,romance",{"BR":5.0}),
 ("TWICE","KR","kpop","kpop,party",{"KR":2.6,"JP":2.6}),
 ("Jung Kook","KR","kpop,pop","kpop,romance",{"KR":2.6,"JP":2.0,"IN":1.2}),
 ("NewJeans","KR","kpop","kpop,dreamy",{"KR":3.0,"JP":1.8}),
 ("Rammstein","DE","metal","metal",{"DE":3.0}),
 ("Bring Me The Horizon","UK","metal,alternative","metal,anthem",{"UK":1.6,"DE":1.3,"JP":1.3}),
 ("GIMS","FR","hiphop,pop","street,romance",{"FR":3.2}),
 ("Stray Kids","KR","kpop","kpop,anthem",{"KR":2.6,"JP":2.0},11_000_000),
 ("SEVENTEEN","KR","kpop","kpop,party",{"KR":2.6,"JP":2.2},8_500_000),
 ("aespa","KR","kpop,electronic","kpop,edm",{"KR":2.8,"JP":1.6},8_000_000),
 ("YOASOBI","JP","pop","jpop,anthem",{"JP":4.0,"KR":1.2},9_500_000),
 ("Kenshi Yonezu","JP","rock,pop","jpop,rock",{"JP":4.2},8_500_000),
 ("Ado","JP","pop,rock","jpop,rock",{"JP":4.0},7_500_000),
 ("Fujii Kaze","JP","pop,rnb","jpop,dreamy",{"JP":3.6,"IN":1.3},6_500_000),
 ("Mrs. GREEN APPLE","JP","pop,rock","jpop,anthem",{"JP":4.4},6_000_000),
 ("Asake","NG","afrobeats","afro,party",{"NG":3.0,"UK":1.4},9_000_000),
 ("Davido","NG","afrobeats","afro,party",{"NG":3.0,"UK":1.3},8_500_000),
 ("Black Sherif","GH","afrobeats,hiphop","afro,street",{"NG":2.0,"UK":1.2},3_500_000),
 ("Apache 207","DE","hiphop,pop","street,romance",{"DE":3.2},5_500_000),
 ("Norah Jones","US","jazz","jazzy,ballad",{"US":1.1,"JP":1.6},6_000_000),
 ("Jacob Collier","UK","jazz","jazzy,dreamy",{"UK":1.3},2_200_000),
 ("Amr Diab","EG","pop","romance,party",{},6_000_000),
 ("Sleep Token","UK","metal,alternative","metal,moody",{"UK":1.6,"US":1.1},9_000_000),
 ("Peggy Gou","KR","electronic","edm,dreamy",{"DE":1.5,"KR":1.4,"UK":1.2},5_000_000),
]
FICT = [
 ("Sable Rose","AU","alternative","moody,dreamy",{"AU":1.5},420_000),
 ("Velvet Static","UK","rock","rock,anthem",{"UK":1.5},380_000),
 ("Amara Lin","CA","indie","dreamy,ballad",{"CA":1.5},310_000),
 ("Marcus Bell","US","jazz","jazzy",{},260_000),
 ("Iron Meridian","DE","metal","metal",{"DE":1.6},520_000),
 ("Noor Haddad","AE","pop","romance,party",{},350_000),
 ("Thiago Reis","BR","electronic","edm,party",{"BR":1.6},600_000),
 ("Yuna Park","KR","rnb","moody,romance",{"KR":1.6},450_000),
 ("Kofi Mensah","GH","afrobeats","afro,party",{"NG":1.5},700_000),
]
def tier(ml):
  return 'superstar' if ml>=70e6 else 'star' if ml>=35e6 else 'established' if ml>=12e6 else 'rising'
out=[]; missing=[]
for i,row in enumerate(R):
  name,c,g,st,mk=row[:5]
  if name in real: ml=real[name]; est=False
  else:
    if len(row)<6: missing.append(name); continue
    ml=row[5]; est=True
  out.append(dict(id=f"a{i}",name=name,country=c,genres=g.split(','),styles=st.split(','),markets=mk,ml=ml,tier=tier(ml),estimated=est,real=True))
for j,row in enumerate(FICT):
  name,c,g,st,mk,ml=row
  out.append(dict(id=f"f{j}",name=name,country=c,genres=g.split(','),styles=st.split(','),markets=mk,ml=ml,tier='rising',estimated=True,real=False))
assert not missing, missing
assert len({o['name'] for o in out})==len(out)
js = ["// Real-world artist roster used as NPCs. Generated by scripts/gen-artists.py.",
"// Starting monthly listeners: Spotify monthly listeners as listed on kworb.net/spotify/listeners.html,",
"// scraped 2026-10-26 (top 1,000). Acts not in that list carry an estimate (estimated: true).",
"// No real song titles or likenesses are used: titles are generated from style word pools and",
"// avatars are generative artwork. Fictional rising acts (real: false) fill niche genres.",
"export const REAL_ARTISTS_SOURCE = { url: 'https://kworb.net/spotify/listeners.html', date: '2026-10-26' };",
"export const ARTIST_ROSTER = ["]
for o in out:
  js.append("  "+json.dumps(o, ensure_ascii=False)+",")
js.append("];")
open(sys.argv[2],'w').write("\n".join(js)+"\n")
from collections import Counter
print(len(out), Counter(o['tier'] for o in out), sum(o['estimated'] for o in out))
