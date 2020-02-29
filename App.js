import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, StyleSheet, Text, ScrollView, View, RefreshControl, Modal, AsyncStorage } from 'react-native';
import RCTNetworking from 'RCTNetworking';
import { WebView } from 'react-native-webview';
import { AppLoading } from 'expo';
import axios from 'axios';
import moment from 'moment';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { Table, TableWrapper, Row, Rows, Col } from 'react-native-table-component';
import { Container, Header, Title, Body, Right, Button, Icon, Card, CardItem, Form, Item, Input, Label } from 'native-base';
import tblParser from './utils/tbl-parser';

const URL_ROOT = 'http://www2.ccjh.cyc.edu.tw/classtable/';
const URL = 'http://www2.ccjh.cyc.edu.tw/classtable/down.asp';
const URL_RAW = 'http://www2.ccjh.cyc.edu.tw/classtable/down.asp?sqlstr=102&type=teacher&class=week&weekno=1&selArrange=R&selWindow=Left&yt=108,2';
const TBL_HEADER = ['', '一', '二', '三', '四', '五', '六'];
const TBL_TITLE = ['早', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const HEIGHT = 48;
const headerFlexArr = Array(7).fill(0).map(() => 1);
const colFlexArr = Array(10).fill(0).map(() => HEIGHT);

RCTNetworking.clearCookies(() => {});

export default function App() {
  const [tbl, setTbl] = useState([]);
  const [weekno, setWeekno] = useState('1');
  const [isReady, setIsReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(moment());
  const [modal, setModal] = useState(false);
  const [teacherId, setTeacherId] = useState('102');
  const [updating, setUpdating] = useState(false);
  const [dayOne, setDayOne] = useState('2020-02-23');
  const [yt, setYt] = useState('108,2');

  useEffect(() => {
    (async () => {
      await Font.loadAsync({
        Roboto: require('native-base/Fonts/Roboto.ttf'),
        Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf'),
        ...Ionicons.font,
      })
      setIsReady(true);

      const id = await AsyncStorage.getItem('@CCJH:teacherId');
      if (id !== null) {
        setTeacherId(id);
      }
      const dOne = await AsyncStorage.getItem('@CCJH:dayOne');
      let d = moment(`${dayOne} 00:00:00+0800`);
      if (dOne !== null) {
        d = moment(`${dOne} 00:00:00+0800`);
        setDayOne(dOne);
      }
      setWeekno(Math.ceil(now.diff(d, 'days') / 7) + '');
      const yT = await AsyncStorage.getItem('@CCJH:yt');
      if (yT !== null) {
        setYt(yT);
      }
    })();
  }, []);

  useEffect(() => {
    refreshTbl();
  }, [weekno, teacherId, yt]);

  const refreshTbl = async () => {
    setUpdating(true);
    const { data } = await axios.get(URL, {
      params: {
        sqlstr: teacherId,
        type: 'teacher',
        class: 'week',
        weekno,
        selArrange: 'L',
        selWindow: 'Left',
        yt,
      }
    });
    setTbl(tblParser(data));
    setNow(moment());
    setUpdating(false);
  };

  const onRefresh = useCallback(() => {
    (async () => {
      setRefreshing(true);
      refreshTbl();
      setRefreshing(false);
    })();
  }, [refreshing, weekno, teacherId, yt]);

  const updateWeekno = (step) => () => {
    const weeknoInt = parseInt(weekno);
    if (weeknoInt + step > 0) {
      setWeekno((weeknoInt + step) + '');
    } else {
      setWeekno('1');
    }
  }

  const tblElm = tbl.map(row => (
    row.map((col, idx) => {
      const d = now.day();
      const nowWeekno = Math.ceil(now.diff(dayOne, 'days') / 7);
      const highlight = idx + 1 === d && nowWeekno === parseInt(weekno);
      const cStyles = [styles.cell, highlight ? styles.cellInverted : undefined];
      const ctStyles = [styles.cellText, highlight ? styles.cellTextInverted : undefined];
      if (col === null) {
        return <View style={cStyles}/>
      } else {
        return (
          <View style={cStyles}>
            <Text style={ctStyles}>{col.name}</Text>
            <Text style={ctStyles}>{col.class}</Text>
          </View>
        )
      }
    })
  ))

  if (!isReady) {
    return <AppLoading />;
  }

  /**
   * WebView here is for obtaining ASP session in cookie
   */

  return (
    <Container style={styles.container}>
      <Modal
        animationType="fade"
        transparent
        visible={modal}
      >
        <View
          style={styles.modal}
        >
          <Card style={styles.card}>
            <Form style={styles.cardBody}>
              <Item floatingLabel>
                <Label>Teacher ID</Label>
                <Input value={teacherId} onChangeText={text => {
                  setTeacherId(text);
                }}/>
              </Item>
              <Item floatingLabel>
                <Label>Semester</Label>
                <Input value={yt} onChangeText={text => {
                  setYt(text);
                }}/>
              </Item>
              <Item floatingLabel>
                <Label>First Day (Restart required)</Label>
                <Input value={dayOne} onChangeText={text => {
                  setDayOne(text);
                }}/>
              </Item>
            </Form>
            <CardItem footer style={styles.cardFooter}>
              <Button transparent onPress={() => {
                AsyncStorage.setItem('@CCJH:teacherId', teacherId);
                AsyncStorage.setItem('@CCJH:dayOne', dayOne);
                AsyncStorage.setItem('@CCJH:yt', yt);
                refreshTbl();
                setModal(false);
              }}>
                <Text>Confirm</Text>
              </Button>
            </CardItem>
          </Card>
        </View>
      </Modal>
      <View style={styles.webview}>
        <WebView source={{ uri: URL_ROOT }} onLoadEnd={refreshTbl}/>
      </View>
      <Header>
        <Body>
          <Title style={styles.title}>{updating ? 'Updating...' : `Updated@${now.format('HH:mm:ss')}`}</Title>
        </Body>
        <Right>
          <Button transparent onPress={updateWeekno(-1)}>
            <Icon name="arrow-back" />
          </Button>
          <Button transparent>
            <Text style={styles.whiteText}>{weekno}</Text>
          </Button>
          <Button transparent onPress={updateWeekno(1)}>
            <Icon name="arrow-forward" />
          </Button>
          <Button transparent onPress={() => setModal(true)}>
            <Icon name="settings" />
          </Button>
        </Right>
      </Header>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Table style={styles.tbl} borderStyle={{ borderWidth: 1, borderColor: '#1d96b2' }}>
          <Row style={styles.tblHeader} textStyle={[styles.text, styles.whiteText]} data={TBL_HEADER} flexArr={headerFlexArr}/>
          <TableWrapper style={styles.wrapper}>
            <Col textStyle={styles.text} data={TBL_TITLE} heightArr={colFlexArr} />
            <Rows style={styles.row} data={tblElm} flexArr={Array(6).fill(0).map(() => 1)} />
          </TableWrapper>
        </Table>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: StatusBar.currentHeight,
  },
  title: {
    fontSize: 14,
  },
  tbl: {
    margin: 8,
  },
  text: {
    textAlign: 'center',
  },
  whiteText: {
    color: 'white',
  },
  wrapper: {
    flexDirection: 'row',
  },
  tblHeader: {
    height: 40,
    backgroundColor: '#1d96b2',
  },
  row: {
    height: HEIGHT,
  },
  webview: {
    height: 0,
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 12,
  },
  cellInverted: {
    backgroundColor: 'rgba(29,150,178,0.25)',
  },
  cellTextInverted: {
    fontWeight: 'bold',
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
  },
  card: {
    marginLeft: 8,
    marginRight: 8,
  },
  cardBody: {
    margin: 8,
    marginRight: 32,
  },
  cardFooter: {
    justifyContent: 'flex-end',
  }
});
