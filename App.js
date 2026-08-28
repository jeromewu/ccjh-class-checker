/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect, useCallback} from 'react';
import type {Node} from 'react';
import {
  StatusBar,
  StyleSheet,
  ScrollView,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import {
  Table,
  TableWrapper,
  Row,
  Rows,
  Col,
} from 'react-native-table-component';
import {
  NativeBaseProvider,
  Modal,
  Stack,
  FormControl,
  Input,
  Button,
  HStack,
  Icon,
  IconButton,
  Box,
} from 'native-base';
import axios from 'axios';
import moment from 'moment';
import {WebView} from 'react-native-webview';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNRestart from 'react-native-restart';
import {titleParser, tblParser, headerParser} from './utils/parsers';

const API_URL =
  'https://cloud2.shin-her.com.tw/ClassTableV2/ClassTableForTest/GetTimetable';
const SC = '5452f57dcf6af8f84640180466f83e05';
const PAGE_URL = `https://cloud2.shin-her.com.tw/ClassTableV2/ClassTable?sc=${SC}`;
// Every request field that never varies, including the Chinese-keyed display
// options the endpoint expects verbatim. refreshTbl adds only Year, Term,
// WeekNo, TeacherNo and the token on top.
const STATIC_FIELDS = {
  SchoolCode: '104319',
  ClassNo: '',
  ClassroomNo: '',
  CrossName: '',
  SubjectNo: '',
  ShowWindow: 'left',
  TimetableType: 'Teacher',
  IsReverse: 'false',
  教師超鐘點顯示: '隱藏',
  教師姓名: '正常顯示',
  學生能檢視的課程: '學生能檢視整天的課程',
  檢視權限設定: '學生能檢視整天的課程',
  是否顯示午休: '顯示',
  是否顯示早自習: '顯示',
  是否顯示節次時間: '顯示',
  顯示科目名稱: '全名',
  是否顯示總時數: '否',
  是否顯示實施日期: '否',
  實施開始日期: '',
  實施結束日期: '',
};
// Injected into the ClassTable page to hand the anti-forgery token back to RN.
const TOKEN_JS = `(function () {
  try {
    var el = document.querySelector('input[name=__RequestVerificationToken]');
    if (el && el.value) {
      window.ReactNativeWebView.postMessage(el.value);
    }
  } catch (e) {}
  true;
})();`;
const TBL_HEADER = ['', '一', '二', '三', '四', '五', '六'];
const TBL_TITLE = ['早', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const HEIGHT = 48;
const headerFlexArr = Array(7)
  .fill(0)
  .map(() => 1);
const colFlexArr = Array(10)
  .fill(0)
  .map(() => HEIGHT);
const stackColor = '#2196f3';
const borderStyle = {borderWidth: 1, borderColor: '#1d96b2'};
const toMoment = str => moment(str, 'YYYY-MM-DD');
// Hand-rolled because axios 0.27 does not recognise React Native's
// URLSearchParams polyfill as a form body (no Symbol.toStringTag) and would
// JSON-encode it instead.
const encodeForm = obj =>
  Object.keys(obj)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
    .join('&');

const App: () => Node = () => {
  const [tbl, setTbl] = useState([]);
  // { [weekDay]: 'YYYY-MM-DD' } for the currently shown week.
  const [header, setHeader] = useState({});
  const [token, setToken] = useState('');
  const [title, setTitle] = useState('');
  const [weekno, setWeekno] = useState('1');
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(moment());
  const [modal, setModal] = useState(false);
  const [teacherId, setTeacherId] = useState('102');
  const [updating, setUpdating] = useState(false);
  // init week is a hack to fix the case when
  // there is a gap week between weeks.
  const [initWeek, setInitWeek] = useState('1');
  // monday of initial week
  const [dayOne, setDayOne] = useState('2026-08-31');
  // "Year,Term" for the new API, e.g. "115,1".
  const [yt, setYt] = useState('115,1');

  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem('@CCJH:teacherId');
      if (id !== null) {
        setTeacherId(id);
      }
      let week = await AsyncStorage.getItem('@CCJH:initWeek');
      if (week !== null) {
        setInitWeek(week);
      } else {
        week = initWeek;
      }
      let d1 = await AsyncStorage.getItem('@CCJH:dayOne');
      if (d1 !== null) {
        setDayOne(d1);
      } else {
        d1 = dayOne;
      }
      const yT = await AsyncStorage.getItem('@CCJH:yt');
      if (yT !== null) {
        setYt(yT);
      }

      setWeekno(now.isBefore(toMoment(d1))
      // Earlier than day one, set week no to init week.
        ? week
        : (parseInt(week) + Math.floor(now.diff(toMoment(d1), 'days') / 7)) + ''
      );
    })();
  }, []);

  const onRefresh = useCallback(() => {
    (async () => {
      setRefreshing(true);
      refreshTbl();
      setRefreshing(false);
    })();
  }, [refreshing, weekno, teacherId, yt, token]);

  useEffect(() => {
    refreshTbl();
  }, [weekno, teacherId, yt, token]);

  const updateWeekno = step => () => {
    const weeknoInt = parseInt(weekno);
    if (weeknoInt + step > parseInt(initWeek)) {
      setWeekno(weeknoInt + step + '');
    } else {
      setWeekno(initWeek);
    }
  };

  const refreshTbl = async () => {
    // Wait for the anti-forgery token scraped from the ClassTable page.
    if (!token) {
      return;
    }
    setUpdating(true);
    try {
      const [year, term] = yt.split(',');
      const body = encodeForm({
        ...STATIC_FIELDS,
        Year: (year || '').trim(),
        Term: (term || '').trim(),
        WeekNo: weekno,
        TeacherNo: teacherId,
        __RequestVerificationToken: token,
      });
      const {data} = await axios.post(API_URL, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: PAGE_URL,
        },
      });
      setTitle(titleParser(data));
      setTbl(tblParser(data));
      setHeader(headerParser(data));
    } catch (err) {
      // ignore errors.
    }
    setNow(moment());
    setUpdating(false);
  };

  const today = now.format('YYYY-MM-DD');
  const tblElm = tbl.map(row =>
    row.map((col, idx) => {
      // Highlight the column whose server-provided date is today.
      const highlight = header[idx + 1] === today;
      const cStyles = [
        styles.cell,
        highlight ? styles.cellInverted : undefined,
      ];
      const ctStyles = [
        styles.cellText,
        highlight ? styles.cellTextInverted : undefined,
      ];
      if (col === null) {
        return <View style={cStyles} />;
      } else {
        return (
          <View style={cStyles}>
            {col.items.map((item, i) => (
              <Text
                style={[
                  ...ctStyles,
                  i === 0 ? styles.redText : styles.blueText,
                ]}
                key={i}>
                {item}
              </Text>
            ))}
          </View>
        );
      }
    }),
  );

  const genTblHeader = () =>
    TBL_HEADER.map((label, idx) => {
      const iso = header[idx];
      if (idx === 0 || !iso) {
        return label;
      }
      return `${label}\n${+iso.slice(5, 7)}/${+iso.slice(8, 10)}`;
    });

  return (
    <NativeBaseProvider>
      <Box flex="1" safeAreaTop bg="white">
        <View style={styles.webview}>
          <WebView
            source={{uri: PAGE_URL}}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            injectedJavaScript={TOKEN_JS}
            onMessage={e => setToken(e.nativeEvent.data)}
          />
        </View>
        <Modal
          animationPreset="fade"
          isOpen={modal}
          onClose={() => setModal(false)}>
          <Modal.Content maxWidth="400px">
            <Modal.Body>
              <FormControl>
                <Stack floatingLabel>
                  <FormControl.Label>教師編號</FormControl.Label>
                  <Input
                    value={teacherId}
                    onChangeText={text => {
                      setTeacherId(text);
                    }}
                  />
                </Stack>
                <Stack floatingLabel>
                  <FormControl.Label>學年,學期</FormControl.Label>
                  <Input
                    value={yt}
                    onChangeText={text => {
                      setYt(text);
                    }}
                  />
                </Stack>
                <Stack floatingLabel>
                  <FormControl.Label>初始週次及其週一日期</FormControl.Label>
                  <HStack>
                    <Input
                      w="30%"
                      value={initWeek}
                      onChangeText={text => {
                        setInitWeek(text);
                      }}
                    />
                    <Input
                      w="70%"
                      value={dayOne}
                      onChangeText={text => {
                        setDayOne(text);
                      }}
                    />
                  </HStack>
                </Stack>
              </FormControl>
            </Modal.Body>
            <Modal.Footer>
              <Button.Group>
                <Button
                  onPress={() => {
                    AsyncStorage.setItem('@CCJH:teacherId', teacherId);
                    AsyncStorage.setItem('@CCJH:initWeek', initWeek);
                    AsyncStorage.setItem('@CCJH:dayOne', dayOne);
                    AsyncStorage.setItem('@CCJH:yt', yt);
                    setWeekno(now.isBefore(toMoment(dayOne))
                      // Earlier than day one, set week no to init week.
                      ? initWeek
                      : (parseInt(initWeek) + Math.floor(now.diff(toMoment(dayOne), 'days') / 7)) + ''
                    );
                    refreshTbl();
                    setModal(false);
                  }}>
                  <Text>確定</Text>
                </Button>
              </Button.Group>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
        <HStack
          bg={stackColor}
          px="1"
          py="3"
          justifyContent="space-between"
          alignItems="center"
          w="100%">
          <HStack alignItems="center">
            <Text style={styles.whiteText}>{title}</Text>
          </HStack>
          <HStack alignItems="center">
            <IconButton
              icon={
                <Icon
                  as={MaterialIcons}
                  name="refresh"
                  color="white"
                  size={6}
                />
              }
              onPress={() => {
                RNRestart.Restart();
              }}
            />
          </HStack>
        </HStack>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <Table style={styles.tbl} borderStyle={borderStyle}>
            <Row
              style={styles.tblHeader}
              textStyle={[styles.text, styles.whiteText]}
              data={genTblHeader()}
              flexArr={headerFlexArr}
            />
            <TableWrapper style={styles.wrapper}>
              <Col
                textStyle={[styles.text, styles.blackText]}
                data={TBL_TITLE}
                heightArr={colFlexArr}
              />
              <Rows
                style={styles.row}
                data={tblElm}
                flexArr={Array(6)
                  .fill(0)
                  .map(() => 1)}
              />
            </TableWrapper>
          </Table>
        </ScrollView>
        <HStack
          bg={stackColor}
          px="1"
          py="3"
          justifyContent="space-between"
          alignItems="center"
          w="100%">
          <HStack alignItems="center">
            <Text style={styles.whiteText}>
              {updating ? '更新中...' : `已更新@${now.format('HH:mm:ss')}`}
            </Text>
          </HStack>
          <HStack alignItems="center">
            <IconButton
              icon={
                <Icon
                  as={MaterialIcons}
                  name="arrow-back"
                  color="white"
                  size={6}
                />
              }
              onPress={updateWeekno(-1)}
            />
            <Text style={styles.whiteText}>{`第${weekno}週`}</Text>
            <IconButton
              icon={
                <Icon
                  as={MaterialIcons}
                  name="arrow-forward"
                  color="white"
                  size={6}
                />
              }
              onPress={updateWeekno(1)}
            />
            <IconButton
              icon={
                <Icon
                  as={MaterialIcons}
                  name="settings"
                  color="white"
                  size={6}
                />
              }
              onPress={() => setModal(true)}
            />
          </HStack>
        </HStack>
      </Box>
    </NativeBaseProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
  },
  tbl: {
    margin: 4,
    width: StatusBar.width,
  },
  text: {
    textAlign: 'center',
  },
  whiteText: {
    color: 'white',
  },
  blackText: {
    color: 'black',
  },
  redText: {
    color: 'red',
  },
  greenText: {
    color: 'green',
  },
  blueText: {
    color: 'blue',
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
    fontSize: 8,
  },
  cellInverted: {
    backgroundColor: 'rgba(29,150,178,0.25)',
  },
  cellTextInverted: {
    fontWeight: 'bold',
  },
});

export default App;
