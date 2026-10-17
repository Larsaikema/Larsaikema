def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+0.05)/(lo+0.05)
if __name__=='__main__':
    import sys
    P=dict(Klaproos='#C93C1C',KlaproosDonker='#A9321A',Inkt='#1D2420',Kiezel='#5D625C',Polder='#154F3E',Zon='#FFC23A',Zand='#FBF6EC',Duin='#F2E8D5',Wit='#FFFFFF',Linnen='#ECEEE8',Studio='#EFEDE8')
    for c in ['#8E1B2E','#9B1C31','#A3122F','#8C1D2B','#7F1D2D']:
        print('err',c,[round(cr(c,b),2) for b in ['#FBF6EC','#FFFFFF','#FBEAEA','#FCEDEE','#F2E8D5']], 'vs klaproos', round(cr(c,'#C93C1C'),2))
    for c in ['#8A5A00','#7A5200','#915F00','#865800','#7D5100']:
        print('oker',c,[round(cr(c,b),2) for b in ['#FBF6EC','#FFFFFF','#F2E8D5','#FFF4DA','#ECEEE8']])
    for k in ['Klaproos','Polder','Inkt','Kiezel','KlaproosDonker']:
        print(k,{b:round(cr(P[k],P[b]),2) for b in ['Zand','Duin','Wit','Linnen','Studio']})
    print('zon on', {b:round(cr(P['Zon'],P[b]),2) for b in ['Inkt','Polder','Klaproos','Zand']})
    print('zand on', {b:round(cr(P['Zand'],P[b]),2) for b in ['Inkt','Polder','Klaproos','KlaproosDonker']})
    print('wit on', {b:round(cr('#FFFFFF',P[b]),2) for b in ['Klaproos','KlaproosDonker','Polder','Inkt']})
