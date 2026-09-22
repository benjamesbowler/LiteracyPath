"""Distinct architectural landmarks for the other eleven Arcade games.

Helpers, palette and coordinate convention are owned by build_arcade_assets.py.
Moving parts are prefixed so the delivery script can preserve their real pivot.
"""
import math


def world_builders(api):
    box, beam, rings = (api[k] for k in ('box', 'beam', 'rings'))
    cylinder, slab, arch = (api[k] for k in ('cylinder', 'slab', 'arch'))

    def roof(name, x, y, z, width=3.6, depth=2.7, color='Teal'):
        for side in [-1, 1]:
            slab(name, [(x, z-depth/2), (x+side*width/2, z-depth/2),
                        (x+side*width/2, z+depth/2), (x, z+depth/2)], y, .14, color)
        # Curved, layered roof profile rather than a floating flat plate.
        for i in range(7):
            xx=x+(i-3)*width/7
            box(name+' tile', (xx,y+.38*(1-abs(i-3)/3),z), (width/7+.035,.12,depth),color,.045)

    def deck(name, x=0, y=.2, z=0, width=4, depth=3):
        for i in range(9):
            box(name+' plank',(x+(i-4)*width/9,y,z),(width/9-.025,.18,depth),'WoodLight',.025)
        for side in [-1,1]:
            beam(name+' bearer',(x-width/2,y-.18,z+side*depth*.37),
                 (x+width/2,y-.18,z+side*depth*.37),.13,'Wood')

    def lantern(x,y,z, moving=False):
        prefix='Moving ' if moving else ''
        cylinder(prefix+'lantern glass',(x,y,z),.17,.38,'Amber',n=12)
        cylinder(prefix+'lantern crown',(x,y+.23,z),.25,.12,'Teal',top=.1,n=12)
        cylinder(prefix+'lantern base',(x,y-.24,z),.22,.08,'Gold',n=12)
        for side in [-1,1]:beam(prefix+'lantern rib',(x+side*.18,y-.2,z),(x+side*.18,y+.2,z),.025,'Gold')

    def vane(x,y,z):
        beam('Weather mast',(x,y-.75,z),(x,y,z),.045,'Gold')
        beam('Moving wind arrow',(x-.65,y,z),(x+.65,y,z),.055,'Gold')
        slab('Moving feather',[(x-.65,z),(x-.35,z-.22),(x-.35,z+.22)],y,.05,'Coral')
        cylinder('Moving weather hub',(x,y,z),.11,.2,'Gold',n=12)

    def motion(pivot, axis=1, amplitude=.22, spin=False):
        return {'pivot':pivot,'axis':axis,'amplitude':amplitude,'spin':spin}

    def treetop():
        rings('Hollow ancient oak',[(0,1.1,.8,0,0),(1.6,.83,.7,-.15,0),(3.2,.72,.61,.1,0),(4.2,.9,.68,0,0)],'Wood',n=16)
        arch('Burrow arch',(0,.4,-.8),.68,.18,.13,'WoodLight')
        box('Burrow shadow',(0,.55,-.79),(1.1,1.05,.08),'Navy',.2)
        deck('Treehouse balcony',y=2.5,width=3.1,depth=2.1)
        for side in [-1,1]:
            beam('Balcony brace',(side*.3,1.2,0),(side*1.35,2.42,-.8),.12,'WoodLight')
            beam('Branch',(side*.35,3.5,.3),(side*1.8,4.25,.35),.22,'Wood',r2=.07)
            rings('Oak canopy',[(3.9,.65,.7,side*1.5,.4),(4.3,1.12,.95,side*1.5,.4),(4.8,.6,.55,side*1.5,.4)],'LeafLight' if side<0 else 'Leaf',n=10)
        roof('Little roof',0,3.8,-.25,2.7,2)
        beam('Lantern branch',(.3,3.2,-1),(.95,3.2,-1),.06,'WoodLight')
        beam('Moving lantern chain',(.95,3.2,-1),(.95,2.88,-1),.022,'Gold')
        lantern(.95,2.62,-1,True)
        return motion((.95,3.2,-1),1,.12)

    def cloudlift():
        deck('Lookout cradle',y=.45,width=3.2,depth=2.5)
        for side in [-1,1]:
            beam('Twisting vine',(side*1.15,.4,.65),(side*.85,3.4,.65),.12,'LeafDark')
            beam('Vine tie',(side*.85,3.4,.65),(0,4.5,.4),.09,'Leaf')
            for i in range(3):
                slab('Broad lookout leaf',[(side*1.1,.65),(side*(1.8-i*.15),.3),(side*1.4,1.25)],1.2+i*.7,.06,'LeafLight')
        rings('Seed canopy',[(2.95,1.7,1.35,0,.2),(3.2,1.75,1.4,0,.2),(3.8,1.05,.9,0,.2),(4.3,.1,.1,0,.2)],'Moss',n=16)
        for x in [-1.25,1.25]:
            beam('Balustrade',(x,.5,-.9),(x,1.3,-.9),.055,'WoodLight')
        beam('Balustrade crossbar',(-1.25,1.3,-.9),(1.25,1.3,-.9),.06,'WoodLight')
        beam('Moving seed lantern cord',(0,3.1,-.85),(0,2.65,-.85),.025,'Gold')
        lantern(0,2.4,-.85,True)
        return motion((0,3.1,-.85),1,.12)

    def workshop():
        deck('Workshop floor',width=4.2,depth=2.8)
        for side in [-1,1]:
            beam('Timber scaffold',(side*1.6,.15,.65),(side*1.6,3.4,.65),.16,'Wood')
            beam('Scaffold brace',(side*1.6,.8,.65),(side*.7,2.5,.65),.09,'WoodLight')
        beam('Crane crossbeam',(-1.95,3.25,.65),(1.95,3.25,.65),.18,'WoodLight')
        roof('Workshop shelter',-.75,2.7,.4,2,2.8)
        for j in range(4):box('Stacked building timber',(-.85,.42+j*.19,-.1),(1.65,.16,.52),'WoodLight')
        for side in [-1,1]:beam('Crane rope',(1.35+side*.12,3.1,.65),(1.35+side*.12,1.5,.65),.025,'Gold')
        cylinder('Pulley housing',(1.35,3.18,.65),.28,.23,'Navy',n=16)
        box('Moving counterweight',(1.35,1.48,.65),(.45,.5,.4),'Teal',.08)
        lantern(-1.55,2,-.72)
        return motion((1.35,3.1,.65),1,.1)

    def percussion():
        cylinder('Acoustic stage',(0,.15,0),1,.3,'Wood',n=24)
        arch('Acoustic shell',(0,.3,.85),1,.24,.35,'Teal',steps=24)
        arch('Gold acoustic trim',(0,.3,.63),1.74,.07,.08,'Gold',steps=24)
        for x,y,r in [(-.75,.75,.52),(.65,.85,.6),(0,1.5,.4)]:
            cylinder('Carved drum',(x,y,0),r,.65,'Coral',n=20)
            cylinder('Drum skin',(x,y+.35,0),r+.03,.07,'Ivory',n=24)
            for i in range(8):
                q=i*math.tau/8;beam('Drum tension rope',(x+math.cos(q)*r,y-.3,math.sin(q)*r),(x+math.cos(q)*r,y+.3,math.sin(q)*r),.025,'Gold')
        for x in [-1.4,1.4]:
            beam('Cymbal stand',(x,.3,.3),(x,1.9,.3),.045,'Navy')
            rings('Moving cymbal',[(1.87,.58,.58,x,.3),(1.91,.6,.6,x,.3),(2,.12,.12,x,.3)],'Gold',n=24)
        return motion((0,1.9,.3),0,.07)

    def festival():
        deck('Festival pavilion',width=4.3,depth=2.4)
        for x in [-1.6,1.6]:
            beam('Canopy pillar',(x,.25,.55),(x,3,.55),.11,'Ivory')
        rings('Striped festival roof',[(2.9,2.3,1.55,0,.4),(3.08,2.35,1.6,0,.4),(3.9,.16,.12,0,.4)],'Coral',n=16)
        for i in range(8):
            q=i*math.tau/8
            beam('Canopy gold seam',(0,3.87,.4),(math.cos(q)*2.25,3,math.sin(q)*1.53+.4),.035,'Gold')
        box('Festival cabinet',(0,.8,.45),(2.55,1.05,.8),'Teal',.12)
        for x in [-.85,0,.85]:arch('Cabinet inlay',(x,.55,-.01),.26,.055,.04,'Gold')
        vane(0,4.6,.4)
        return motion((0,4.6,.4),2,spin=True)

    def safari():
        deck('Field station',width=4,depth=3.3)
        for x in [-1.5,1.5]:beam('Tent ridge support',(x,.3,.4),(x,2.8,.4),.075,'Wood')
        beam('Canvas ridge',(-1.65,2.8,.4),(1.65,2.8,.4),.09,'WoodLight')
        # The tent has sloped canvas panels and an open, dark doorway.
        api['mesh']('Safari canvas',[(-1.6,.3,-1.1),(1.6,.3,-1.1),(-1.6,2.8,.4),(1.6,2.8,.4),(-1.6,.3,1.9),(1.6,.3,1.9)],[(0,1,3,2),(2,3,5,4),(0,2,4)],'Sail')
        box('Field desk',(1.1,.92,-1.2),(1.35,.15,.65),'WoodLight')
        for x in [.6,1.6]:beam('Desk leg',(x,.25,-1.2),(x,.92,-1.2),.055,'Wood')
        cylinder('Field flask',(.95,1.2,-1.2),.12,.4,'Teal')
        box('Field journal',(1.28,1.04,-1.25),(.32,.09,.36),'Coral',.025)
        beam('Lantern post',(-1.55,.3,-1.3),(-1.55,2.7,-1.3),.065,'WoodLight')
        beam('Moving hook',(-1.55,2.7,-1.3),(-1.23,2.7,-1.3),.03,'Gold')
        lantern(-1.23,2.33,-1.3,True)
        return motion((-1.55,2.7,-1.3),1,.1)

    def harbour():
        deck('Harbour pier',y=.55,width=4.4,depth=3)
        for x in [-1.8,1.8]:
            for z in [-1.1,1.1]:beam('Pier piling',(x,-.35,z),(x,.75,z),.16,'Wood')
        box('Harbour house',(-.6,1.4,.45),(2,1.8,1.8),'Ivory',.09)
        roof('Harbour roof',-.6,2.5,.45,2.7,2.5)
        box('Harbour door',(-.8,1.2,-.49),(.65,1.22,.09),'Teal',.08)
        box('Harbour window',(.05,1.8,-.49),(.42,.48,.09),'Window',.05)
        center=(1.5,1.2,-.25)
        arch('Moving waterwheel rim',center,1,.13,.22,'WoodLight',start=0,end=math.tau,steps=32)
        for i in range(9):
            q=i*math.tau/9;x=1.5+math.cos(q);y=1.2+math.sin(q)
            beam('Moving waterwheel spoke',center,(x,y,-.25),.055,'Wood')
            box('Moving waterwheel bucket',(x,y,-.25),(.28,.17,.55),'Teal')
        lantern(-1.6,1.95,-.65)
        return motion(center,1,spin=True)

    def orchard():
        cylinder('Orchard stone foundation',(0,.15,0),1,.3,'StoneLight',n=16)
        box('Greenhouse base',(0,.8,.35),(2.9,1.3,2),'WoodLight',.08)
        for x in [-1.2,-.6,0,.6,1.2]:
            box('Greenhouse glass',(x,1.95,-.68),(.51,1,.065),'Window',.04)
            beam('Greenhouse glazing bar',(x,1.4,-.7),(x,2.5,-.7),.028,'Ivory')
        roof('Greenhouse roof',0,2.55,.3,3.5,2.7)
        for x in [-1.5,1.5]:
            box('Seedling trough',(x,.5,-1.15),(.65,.5,.6),'Teal',.08)
            rings('Seedling',[(.7,.15,.15,x,-1.15),(1.1,.38,.32,x,-1.15),(1.45,.06,.06,x,-1.15)],'LeafLight',n=8)
        vane(0,3.65,.3)
        return motion((0,3.65,.3),2,spin=True)

    def station():
        deck('Station platform',width=5,depth=2.7)
        box('Station building',(-.6,1.25,.35),(2.7,2,1.9),'Ivory',.1)
        roof('Station tiled roof',-.6,2.45,.35,3.3,2.5)
        for x in [-1.35,.05]:box('Station window',(x,1.65,-.66),(.56,.7,.08),'Window',.07)
        box('Station entrance',(-.65,.95,-.69),(.62,1.6,.09),'Teal',.1)
        box('Clock tower',(1.5,2,.2),(.75,3.7,.8),'WoodLight',.1)
        arch('Clock case',(1.5,3.3,-.27),.52,.1,.12,'Gold',start=0,end=math.tau,steps=24)
        for i in range(12):
            q=i*math.tau/12
            box('Clock hour mark',(1.5+math.sin(q)*.4,3.3+math.cos(q)*.4,-.32),(.045,.065,.06),'Navy',.005)
        beam('Moving minute hand',(1.5,3.3,-.34),(1.5,3.67,-.34),.025,'Navy',n=6)
        beam('Hour hand',(1.5,3.3,-.35),(1.75,3.24,-.35),.03,'Navy',n=6)
        roof('Clock roof',1.5,3.95,.2,1.25,1.25)
        lantern(-1.85,1.95,-.85)
        return motion((1.5,3.3,-.34),1,spin=True)

    def skate():
        deck('Pavilion foundation',width=5,depth=3.1)
        for x in [-2,2]:beam('Curved pavilion pillar',(x,.3,.9),(x*.8,3.5,.9),.13,'Teal')
        arch('Pavilion arch',(0,1.85,.9),1,.2,.65,'Ivory',steps=24)
        for x in [-1,1]:beam('Arch support',(x,.3,.9),(x,1.85,.9),.1,'Ivory')
        beam('Roof crossbeam',(-1.7,3.5,.9),(1.7,3.5,.9),.12,'Wood')
        roof('Pavilion shelter',0,3.6,.5,4.7,3.2)
        for j in range(3):
            box('Grandstand seat',(0,.45+j*.35,.9-j*.6),(3.8,.16,.48),'WoodLight')
        for x in [-2.15,2.15]:
            cylinder('Park planter',(x,.6,-.65),.4,.85,'Teal',n=12)
            rings('Park shrub',[(.95,.28,.3,x,-.65),(1.3,.5,.47,x,-.65),(1.65,.15,.15,x,-.65)],'LeafLight',n=10)
        vane(0,4.7,.9)
        return motion((0,4.7,.9),2,spin=True)

    def resonance():
        cylinder('Resonance dais',(0,.18,0),1,.36,'Wood',n=24)
        arch('Concert shell',(0,.3,.7),1,.22,.4,'Teal',steps=24)
        for i in range(9):
            x=(i-4)*.35;h=1.2+1.3*(1-abs(i-4)/4)
            beam('Organ pipe',(x,.4,.65),(x,h,.65),.105,'Gold',n=12)
            cylinder('Pipe cap',(x,h,.65),.125,.1,'Ivory',n=12)
        box('Resonator cabinet',(0,.85,-.3),(3,1,.75),'Ivory',.12)
        for i in range(8):box('Resonance bar',((i-3.5)*.32,1.43,-.35),(.27,.12,.68-i*.035),'Teal' if i%2 else 'Gold',.03)
        beam('Moving resonator pendulum',(0,2.3,-.4),(0,1.7,-.4),.045,'Gold')
        cylinder('Moving pendulum weight',(0,1.68,-.4),.18,.16,'Coral',n=16)
        return motion((0,2.3,-.4),1,.16)

    return {
        'treetop-burrow': {'build':treetop,'game':'letter-leap','sprite':True},
        'cloud-lookout': {'build':cloudlift,'game':'word-climb'},
        'bridge-workshop': {'build':workshop,'game':'word-bridge','sprite':True},
        'percussion-pavilion': {'build':percussion,'game':'sound-beat','sprite':True},
        'festival-pavilion': {'build':festival,'game':'rhyme-pop','sprite':True},
        'canopy-field-station': {'build':safari,'game':'sound-safari','sprite':True},
        'harbour-waterwheel': {'build':harbour,'game':'reel-read','sprite':True},
        'orchard-greenhouse': {'build':orchard,'game':'star-gallery'},
        'station-clock': {'build':station,'game':'sentence-express','sprite':True},
        'skate-pavilion': {'build':skate,'game':'grammar-grind'},
        'resonance-pavilion': {'build':resonance,'game':'soundkeys','sprite':True},
    }
