// UUON Amazing Family Engine — Proprietary Core
// Copyright (c) 2026 Phillip Aguilar Ruiz III / UUON Foundation Inc.
// License: USAL-1.0 — All rights reserved
// This file is served from https://uuon.world/engine/amazing-family/core.js
// It is NOT included in the public GitHub repository.
// Exposes: window.AFE

(function(){
'use strict';

// ── FOLD HELPERS ──

function bxF(p, fl){
  return [
    Math.max(-fl, Math.min(fl, p[0]))*2 - p[0],
    Math.max(-fl, Math.min(fl, p[1]))*2 - p[1],
    Math.max(-fl, Math.min(fl, p[2]))*2 - p[2]
  ];
}

// Full 3D sphere fold — Mandelbox and Box Julia
function jSF(p, dr, mn, fx){
  var r2=p[0]*p[0]+p[1]*p[1]+p[2]*p[2], mn2=mn*mn, fx2=fx*fx;
  var k=r2<mn2 ? fx2/mn2 : r2<fx2 ? fx2/r2 : 1;
  return [[p[0]*k, p[1]*k, p[2]*k], dr*k];
}

// XY-only sphere fold — AmazSurf and SurfMod1
// BUG-02 FIX: r2 from XY only, Z unchanged
function jSFxy(p, dr, mn, fx){
  var r2=p[0]*p[0]+p[1]*p[1], mn2=mn*mn, fx2=fx*fx;
  var k=r2<mn2 ? fx2/mn2 : r2<fx2 ? fx2/r2 : 1;
  return [[p[0]*k, p[1]*k, p[2]], dr*k];
}

// ── CPU DE FUNCTIONS ──

function jMB(U, px, py, pz){
  var z=[px,py,pz], dr=1, sc=U.mbScale, fl=U.mbFold, mr=U.mbMinR, fr=U.mbFixR;
  for(var i=0;i<U.iter;i++){
    z=bxF(z,fl); var s=jSF(z,dr,mr,fr); z=s[0]; dr=s[1];
    z=[z[0]*sc+px, z[1]*sc+py, z[2]*sc+pz]; dr=Math.abs(sc)*dr+1;
  }
  return Math.sqrt(z[0]*z[0]+z[1]*z[1]+z[2]*z[2])/Math.abs(dr);
}

function jAS(U, px, py, pz){
  var z=[px,py,pz], dr=1, sc=U.sScale, fl=U.sFold, mr=U.sMinR, fr=U.sFixR;
  for(var i=0;i<U.iter;i++){
    z=bxF(z,fl); var s=jSFxy(z,dr,mr,fr); z=s[0]; dr=s[1];
    z=[z[0]*sc+px, z[1]*sc+py, z[2]*sc+pz]; dr=Math.abs(sc)*dr+1;
  }
  return Math.sqrt(z[0]*z[0]+z[1]*z[1]+z[2]*z[2])/Math.abs(dr);
}

function jM1(U, px, py, pz){
  var z=[px,py,pz], dr=1, sc=U.m1Scale, fl=U.m1Fold, cx=U.m1JX, cy=U.m1JY, cz=U.m1JZ;
  for(var i=0;i<U.iter;i++){
    z=bxF(z,fl); var s=jSFxy(z,dr,0.5,1); z=s[0]; dr=s[1];
    z=[z[0]*sc+cx, z[1]*sc+cy, z[2]*sc+cz]; dr=Math.abs(sc)*dr+1;
  }
  return Math.sqrt(z[0]*z[0]+z[1]*z[1]+z[2]*z[2])/Math.abs(dr);
}

function jBJ(U, px, py, pz){
  var z=[px,py,pz], dr=1, sc=U.bjScale, fl=U.bjFold, cx=U.bjCx, cy=U.bjCy, cz=U.bjCz;
  for(var i=0;i<U.iter;i++){
    z=bxF(z,fl); var s=jSF(z,dr,0.5,1); z=s[0]; dr=s[1];
    z=[z[0]*sc+cx, z[1]*sc+cy, z[2]*sc+cz]; dr=Math.abs(sc)*dr+1;
  }
  return Math.sqrt(z[0]*z[0]+z[1]*z[1]+z[2]*z[2])/Math.abs(dr);
}

// CPU dispatcher — takes U state object and coordinates
function jDE(U, x, y, z){
  return U.mode===0 ? jMB(U,x,y,z) :
         U.mode===1 ? jAS(U,x,y,z) :
         U.mode===2 ? jM1(U,x,y,z) : jBJ(U,x,y,z);
}

// ── GLSL FRAGMENT SHADER BUILDER ──

function buildFS(mode, iter){
  var st=iter>=16?256:iter>=12?192:128;
  var ep=iter>=16?'0.0002':iter>=12?'0.0003':'0.0005';
  return '#version 300 es\nprecision highp float;\n'+
  '#define MODE '+mode+'\n#define FRAC_ITER '+iter+'\n#define MAX_STEPS '+st+'\n'+
  '#define MAX_DIST 30.\n#define SURF_EPS '+ep+'\n#define STEP_FAC .5\n#define BOUND_R2 64.\n'+
`uniform vec2 uRes;uniform float uCamDist,uYaw,uPitch,uFov;
uniform float uAmbient,uDiffuse,uSpecular,uAoStr;uniform int uColorMode;
uniform float uMBScale,uMBFold,uMBMinR,uMBFixR;
uniform float uSScale,uSFold,uSMinR,uSFixR;
uniform float uM1Scale,uM1Fold,uM1JX,uM1JY,uM1JZ;
uniform float uBJScale,uBJFold,uBJCx,uBJCy,uBJCz;
in vec2 vUV;out vec4 fragColor;

vec3 bxF(vec3 p,float f){return clamp(p,-f,f)*2.-p;}

void spF(inout vec3 p,inout float dr,float mn,float fx){
  float r2=dot(p,p),mn2=mn*mn,fx2=fx*fx;
  float ii=step(r2,mn2),o=step(r2,fx2)*(1.-ii);
  float k=ii*(fx2/mn2)+o*(fx2/r2)+(1.-ii-o);
  p*=k;dr*=k;
}

void spFxy(inout vec3 p,inout float dr,float mn,float fx){
  float r2=p.x*p.x+p.y*p.y;
  float mn2=mn*mn,fx2=fx*fx;
  float ii=step(r2,mn2),o=step(r2,fx2)*(1.-ii);
  float k=ii*(fx2/mn2)+o*(fx2/r2)+(1.-ii-o);
  p.xy*=k;dr*=k;
}

float deMB(vec3 p){
  vec3 z=p;float dr=1.;
  for(int i=0;i<FRAC_ITER;i++){z=bxF(z,uMBFold);spF(z,dr,uMBMinR,uMBFixR);z=z*uMBScale+p;dr=abs(uMBScale)*dr+1.;}
  return length(z)/abs(dr);
}
float deAS(vec3 p){
  vec3 z=p;float dr=1.;
  for(int i=0;i<FRAC_ITER;i++){z=bxF(z,uSFold);spFxy(z,dr,uSMinR,uSFixR);z=z*uSScale+p;dr=abs(uSScale)*dr+1.;}
  return length(z)/abs(dr);
}
float deM1(vec3 p){
  vec3 z=p,c=vec3(uM1JX,uM1JY,uM1JZ);float dr=1.;
  for(int i=0;i<FRAC_ITER;i++){z=bxF(z,uM1Fold);spFxy(z,dr,.5,1.);z=z*uM1Scale+c;dr=abs(uM1Scale)*dr+1.;}
  return length(z)/abs(dr);
}
float deBJ(vec3 p){
  vec3 z=p,c=vec3(uBJCx,uBJCy,uBJCz);float dr=1.;
  for(int i=0;i<FRAC_ITER;i++){z=bxF(z,uBJFold);spF(z,dr,.5,1.);z=z*uBJScale+c;dr=abs(uBJScale)*dr+1.;}
  return length(z)/abs(dr);
}

float DE(vec3 p){
  if(MODE==0)return deMB(p);
  if(MODE==1)return deAS(p);
  if(MODE==2)return deM1(p);
  return deBJ(p);
}

vec3 N3(vec3 p){
  const float h=.001;const vec2 k=vec2(1.,-1.);
  return normalize(k.xyy*DE(p+k.xyy*h)+k.yyx*DE(p+k.yyx*h)+k.yxy*DE(p+k.yxy*h)+k.xxx*DE(p+k.xxx*h));
}
float AO(vec3 p,vec3 n){
  float o=0.,w=1.;
  for(int i=0;i<5;i++){float d=float(i+1)*.04;o+=w*(d-abs(DE(p+n*d)));w*=.7;}
  return clamp(1.-o*3.5,0.,1.);
}
float SS(vec3 ro,vec3 rd){
  float r=1.,t=.02,done=0.;
  for(int i=0;i<16;i++){float ad=abs(DE(ro+rd*t));float h=step(ad,SURF_EPS),pp=step(6.,t);done=max(done,max(h,pp));float al=1.-done;r=min(r,al*(12.*ad/t)+done*r);t+=clamp(ad,.01,.2)*al+.5*(1.-al);}
  return clamp(r,0.,1.);
}
vec2 march(vec3 ro,vec3 rd){
  float t=.001,done=0.,hitT=-1.;
  for(int i=0;i<MAX_STEPS;i++){float d=DE(ro+rd*t),ad=abs(d);float h=step(ad,SURF_EPS),pp=step(MAX_DIST,t);hitT+=h*(1.-done)*(t-hitT);done=max(done,max(h,pp));float al=1.-done;t+=max(ad*STEP_FAC,SURF_EPS*.1)*al+.01*(1.-al);}
  return vec2(hitT,0.);
}
vec3 PAL(float t,int m){
  if(m==0)return mix(vec3(0.02),vec3(0.22),t);
  if(m==1)return mix(vec3(0.06,0.03,0.01),vec3(0.24,0.16,0.07),t);
  return mix(vec3(0.03,0.04,0.09),vec3(0.16,0.18,0.28),t);
}
mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,s,0.,1.,0.,-s,0.,c);}
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,-s,0.,s,c);}

void main(){
  vec2 uv=vUV;uv.x*=uRes.x/uRes.y;
  vec3 ro=rX(uPitch)*rY(uYaw)*vec3(0.,0.,uCamDist);
  vec3 rd=rX(uPitch)*rY(uYaw)*normalize(vec3(uv*uFov,-1.8));
  vec3 col=vec3(1.);
  float bb=dot(ro,rd),cc=dot(ro,ro)-BOUND_R2,hh=bb*bb-cc;
  if(hh>=0.){
    float sq=sqrt(hh),tEx=-bb+sq;
    if(tEx>.001){
      float tS=max(-bb-sq,.001);vec2 res=march(ro+rd*tS,rd);
      if(res.x>0.){
        float t=res.x+tS;vec3 p=ro+rd*t,n=N3(p);
        vec3 lD=normalize(vec3(1.2,2.,1.5));
        float diff=max(dot(n,lD),0.);vec3 hv=normalize(lD-rd);float spec=pow(max(dot(n,hv),0.),32.);
        float shd=SS(p+n*.002,lD),occ=AO(p,n);
        vec3 base=PAL(clamp(t/10.,0.,1.),uColorMode);
        col=base*(uAmbient+uDiffuse*diff*shd)+vec3(uSpecular*spec*shd);
        col*=mix(1.,occ,uAoStr);col*=1.-clamp(abs(dot(n,-rd)),0.,1.)*.3;
      }
    }
  }
  col*=1.-dot(vUV,vUV)*.1;
  col=pow(max(col,vec3(0.)),vec3(.4545));
  fragColor=vec4(col,1.);
}`;
}

// ── PUBLIC API ──
window.AFE = {
  buildFS: buildFS,
  jDE:     jDE,
  version: '1.0.0'
};

console.log('[UUON] Amazing Family Engine core loaded — window.AFE ready');
})();
