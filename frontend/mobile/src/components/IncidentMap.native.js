import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { DISASTERS } from '../utils/reports.cjs';
import { colors as c } from '../theme';

const HTML = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0}body{background:#e8efeb}.leaflet-control-attribution{font-size:9px}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
function send(type,id){window.ReactNativeWebView.postMessage(JSON.stringify({type:type,id:id}));}
if(!window.L){send('error');}else{
var map=L.map('map',{zoomControl:false}).setView([7.8731,80.7718],7);
L.control.zoom({position:'bottomright'}).addTo(map);
L.control.attribution({position:'topright',prefix:false}).addTo(map);map.attributionControl.remove();
var tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
var loaded=false;tiles.on('tileload',function(){loaded=true;send('loaded');});tiles.on('tileerror',function(){if(!loaded)send('error');});
var markers=L.layerGroup().addTo(map),position=L.layerGroup().addTo(map),lastRegion='';
window.updateMap=function(data){
markers.clearLayers();position.clearLayers();
data.points.forEach(function(p){var icon=L.divIcon({className:'incident-pin',html:'<div style="background:'+p.color+';width:24px;height:24px;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 5px #555"></div>',iconSize:[30,38],iconAnchor:[15,34]});var marker=L.marker([p.latitude,p.longitude],{icon:icon,zIndexOffset:p.id===data.selectedId?1000:0}).addTo(markers);var title=document.createElement('span');title.textContent=p.title;marker.bindTooltip(title);marker.on('click',function(){send('select',p.id);});});
if(data.userLocation)L.circleMarker([data.userLocation.latitude,data.userLocation.longitude],{radius:7,color:'#fff',weight:3,fillColor:'#2563eb',fillOpacity:1}).addTo(position);
var region=JSON.stringify(data.region);if(region!==lastRegion){lastRegion=region;var r=data.region;map.fitBounds([[r.latitude-r.latitudeDelta/2,r.longitude-r.longitudeDelta/2],[r.latitude+r.latitudeDelta/2,r.longitude+r.longitudeDelta/2]],{animate:false});}
map.invalidateSize();};send('ready');
}
</script></body></html>`;
const SOURCE = { html: HTML, baseUrl: 'https://disaster-connect.local/' };
const severityColors = { Low: '#16835b', Medium: '#c78b13', High: '#e05a24', 'Very High': '#b42318', EMERGENCY: '#b42318' };
export default function IncidentMap({ region, reports = [], userLocation, selectedId, onSelect }) {
  const web = useRef(null);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [list, setList] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const points = useMemo(() => reports.filter(p => Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180).map(p => ({ id: String(p._id), latitude: p.latitude, longitude: p.longitude, title: p.title || p.hazardType || 'Incident', color: severityColors[p.level || p.severity] || DISASTERS[p.disasterType]?.color || c.primary })), [reports]);
  useEffect(() => { if (ready) web.current?.injectJavaScript(`window.updateMap && window.updateMap(${JSON.stringify({ points, region, userLocation, selectedId }).replace(/</g, '\u003c')});true;`); }, [ready, points, region, userLocation, selectedId]);
  useEffect(() => { if (loaded) return undefined; const timer = setTimeout(() => setFailed(true), 20000); return () => clearTimeout(timer); }, [loaded, attempt]);
  function retry() { setReady(false); setLoaded(false); setFailed(false); setAttempt(value => value + 1); }
  return <View style={styles.container}>
    <WebView key={attempt} ref={web} source={SOURCE} style={styles.web} originWhitelist={['*']} javaScriptEnabled domStorageEnabled userAgent="ResQConnect/1.0 (mobile incident map)" onError={() => setFailed(true)} onMessage={({ nativeEvent }) => { try { const message = JSON.parse(nativeEvent.data); if (message.type === 'ready') setReady(true); if (message.type === 'loaded') { setLoaded(true); setFailed(false); } if (message.type === 'error') setFailed(true); if (message.type === 'select' && points.some(p => p.id === message.id)) onSelect(message.id); } catch { /* Ignore malformed bridge messages. */ } }} onShouldStartLoadWithRequest={request => { if (request.url === 'about:blank' || request.url.startsWith('https://disaster-connect.local/')) return true; if (request.url === 'https://www.openstreetmap.org/copyright') void Linking.openURL(request.url); return false; }}/>
    <Pressable accessibilityRole="button" onPress={() => setList(value => !value)} style={styles.toggle}><Text style={styles.link}>{list ? 'Show map' : 'View locations'}</Text></Pressable>
    {(!loaded || failed) && !list && <View style={styles.notice}>{!failed && <ActivityIndicator color={c.primary}/>}<Text style={styles.caption}>{failed ? 'Map unavailable. Check internet or use the location list.' : 'Loading map...'}</Text>{failed && <Pressable accessibilityRole="button" onPress={retry}><Text style={styles.link}>Retry map</Text></Pressable>}</View>}
    {list && <ScrollView style={styles.list} contentContainerStyle={styles.items}><Text style={styles.heading}>Mapped locations</Text>{points.length === 0 && <Text style={styles.caption}>No locations available for this filter.</Text>}{points.map(point => <Pressable key={point.id} accessibilityRole="button" onPress={() => { onSelect(point.id); setList(false); }} style={styles.item}><View style={[styles.dot, { backgroundColor: point.color }]}/><View style={{ flex: 1 }}><Text style={styles.heading}>{point.title}</Text><Text style={styles.caption}>{point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</Text></View></Pressable>)}</ScrollView>}
  </View>;
}
const styles = StyleSheet.create({ container: { flex: 1, minHeight: 180, backgroundColor: '#e8efeb' }, web: { flex: 1 }, toggle: { position: 'absolute', left: 12, top: 12, backgroundColor: 'white', padding: 12, borderRadius: 10, elevation: 2 }, link: { color: c.primary, fontWeight: '700', paddingVertical: 4 }, notice: { position: 'absolute', top: 70, left: 12, right: 72, backgroundColor: 'white', borderRadius: 12, padding: 12, gap: 8 }, caption: { fontSize: 12, color: c.muted, lineHeight: 18 }, list: { position: 'absolute', top: 64, bottom: 72, left: 12, right: 12, backgroundColor: 'white', borderRadius: 12 }, items: { padding: 14, gap: 10 }, item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 10 }, dot: { width: 14, height: 14, borderRadius: 7 }, heading: { color: c.text, fontWeight: '700', fontSize: 14 } });
