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
import {titleParser, tblParser} from './utils/parsers';

const URL_ROOT = 'http://www2.ccjh.cyc.edu.tw/classtable/';
const URL = 'http://www2.ccjh.cyc.edu.tw/classtable/down.asp';
// const URL_RAW =
//   "http://www2.ccjh.cyc.edu.tw/classtable/down.asp?sqlstr=102&type=teacher&class=week&weekno=1&selArrange=R&selWindow=Left&yt=110,2";
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

const App: () => Node = () => {
  const [tbl, setTbl] = useState([]);
  const [title, setTitle] = useState('');
  const [weekno, setWeekno] = useState('1');
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(moment());
  const [modal, setModal] = useState(false);
  const [teacherId, setTeacherId] = useState('102');
  const [updating, setUpdating] = useState(false);
  // init week is a hack to fix the case when
  // there is a gap week between weeks.
  const [initWeek, setInitWeek] = useState('3');
  // monday of initial week
  const [dayOne, setDayOne] = useState('2026-02-23');
  const [yt, setYt] = useState('114,2');

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
  }, [refreshing, weekno, teacherId, yt]);

  useEffect(() => {
    refreshTbl();
  }, [weekno, teacherId, yt]);

  const updateWeekno = step => () => {
    const weeknoInt = parseInt(weekno);
    if (weeknoInt + step > parseInt(initWeek)) {
      setWeekno(weeknoInt + step + '');
    } else {
      setWeekno(initWeek);
    }
  };

  const refreshTbl = async () => {
    setUpdating(true);
    try {
      const {data} = await axios.get(URL, {
        params: {
          sqlstr: teacherId,
          type: 'teacher',
          class: 'week',
          weekno,
          selArrange: 'L',
          selWindow: 'Left',
          yt,
        },
      });
      setTitle(titleParser(data));
      setTbl(tblParser(data));
    } catch (err) {
      // ignore errors.
    }
    setNow(moment());
    setUpdating(false);
  };

  const tblElm = tbl.map(row =>
    row.map((col, idx) => {
      const d = now.day();
      const d1 = toMoment(dayOne);
      const nowWeekno = parseInt(initWeek) + (now.isAfter(d1) ? Math.floor(now.diff(d1, 'days') / 7) : 0);
      const highlight = idx + 1 === d && nowWeekno === parseInt(weekno) && now.isAfter(d1);
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

  const genTblHeader = () => {
    const monday = toMoment(dayOne).add(
      (parseInt(weekno) - parseInt(initWeek)) * 7,
      'days',
    );
    return TBL_HEADER.map((header, idx) => {
      if (idx === 0) {
        return header;
      }
      const d = moment(monday).add(idx - 1, 'days');
      return header + `\n${d.month() + 1}/${d.date()}`;
    });
  };

  return (
    <NativeBaseProvider>
      <Box flex="1" safeAreaTop bg="white">
        <View style={styles.webview}>
          <WebView source={{uri: URL_ROOT}} onLoadEnd={refreshTbl} />
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
                  <FormControl.Label>學期</FormControl.Label>
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
