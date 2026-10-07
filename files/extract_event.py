"""Extract one event from an ATLAS Open Data 13 TeV (2020 release) GamGam ntuple to JSON.
usage: python extract_event.py data_B.root 300908 1315251030 > event.json
Source: https://opendata.cern.ch/record/15006  (root://eospublic.cern.ch//eos/opendata/atlas/OutreachDatasets/2020-08-19/GamGam/)
"""
import sys, json, math, uproot, awkward as ak
fn, run, ev = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
t = uproot.open(fn)["mini"]
cols = [k for k in t.keys() if k.split('_')[0] in ("runNumber","eventNumber","photon","jet","lep","met")]
for a in t.iterate(cols, step_size=200000, library="ak"):
    m = (a.runNumber == run) & (a.eventNumber == ev)
    if ak.any(m):
        e = a[m][0]; break
else:
    sys.exit("event not found")
G = 1e3
ph = [dict(pt=float(e.photon_pt[i])/G, eta=float(e.photon_eta[i]), phi=float(e.photon_phi[i]), E=float(e.photon_E[i])/G,
           tight=bool(e.photon_isTightID[i]), convType=int(e.photon_convType[i])) for i in range(len(e.photon_pt))]
jets = [dict(pt=float(e.jet_pt[i])/G, eta=float(e.jet_eta[i]), phi=float(e.jet_phi[i]), E=float(e.jet_E[i])/G,
             MV2c10=float(e.jet_MV2c10[i]), jvt=float(e.jet_jvt[i])) for i in range(len(e.jet_pt))]
leps = [dict(type=int(e.lep_type[i]), pt=float(e.lep_pt[i])/G, eta=float(e.lep_eta[i]), phi=float(e.lep_phi[i]),
             charge=int(e.lep_charge[i]), tight=bool(e.lep_isTightID[i])) for i in range(len(e.lep_pt))]
def p4(o): return (o["pt"]*math.cosh(o["eta"]), o["pt"]*math.cos(o["phi"]), o["pt"]*math.sin(o["phi"]), o["pt"]*math.sinh(o["eta"]))
E,px,py,pz = [sum(v) for v in zip(*(p4(o) for o in ph[:2]))]
out = dict(source="ATLAS Open Data 13 TeV, 2020 release", file=fn, run=run, event=ev, sqrt_s_TeV=13,
           m_gammagamma_GeV=round(math.sqrt(E*E-px*px-py*py-pz*pz),2),
           photons=ph, jets=jets, leptons=leps, met=dict(et=float(e.met_et)/G, phi=float(e.met_phi)),
           btag_MV2c10_WP={"60%":0.94,"70%":0.8244,"77%":0.645,"85%":0.1758})
print(json.dumps(out, indent=1))
