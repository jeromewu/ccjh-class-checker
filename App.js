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
const URL_RAW = 'http://www2.ccjh.cyc.edu.tw/classtable/down.asp?sqlstr=102&type=teacher&class=week&weekno=3&selArrange=R&selWindow=Left&yt=108,1';
const dayOne = moment('2019-08-25 00:00:00+0800');
const now = moment()
const defaultWeekno = Math.ceil(now.diff(dayOne, 'days') / 7) + '';
const TBL_HEADER = ['', '一', '二', '三', '四', '五', '六'];
const TBL_TITLE = ['早', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const HEIGHT = 48;
const headerFlexArr = Array(7).fill(0).map(() => 1);
const colFlexArr = Array(10).fill(0).map(() => HEIGHT);

RCTNetworking.clearCookies(() => {});

export default function App() {
  const [tbl, setTbl] = useState([]);
  const [weekno, setWeekno] = useState(defaultWeekno);
  const [isReady, setIsReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(moment());
  const [modal, setModal] = useState(false);
  const [teacherId, setTeacherId] = useState('102');
  const [updating, setUpdating] = useState(false);

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
    })();
  }, []);

  useEffect(() => {
    refreshTbl();
  }, [weekno, teacherId])

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
        yt: '108,1',
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
  }, [refreshing, weekno]);

  const updateWeekno = (step) => () => {
    const weeknoInt = parseInt(weekno);
    if (weeknoInt + step > 0) {
      setWeekno((weeknoInt + step) + '');
    } else {
      setWeekno('1');
    }
  }

  const tblElm = tbl.map(row => (
    row.map((col) => {
      if (col === null) {
        return <View/>
      } else {
        return (
          <View style={styles.cell}>
            <Text style={styles.cellText}>{col.name}</Text>
            <Text style={styles.cellText}>{col.class}</Text>
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
            </Form>
            <CardItem footer style={styles.cardFooter}>
              <Button transparent onPress={() => {
                setModal(false);
                AsyncStorage.setItem('@CCJH:teacherId', teacherId);
                refreshTbl();
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
          <Title>{updating ? 'Updating...' : `Updated at ${now.format('HH:mm:ss')}`}</Title>
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
