import {
    StyleSheet,
    View,
    ScrollView,
    RefreshControl,
    Modal,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase/config';
import {
    collection,
    getDoc,
    getDocs,
    orderBy,
    query,
    doc,
} from 'firebase/firestore';
import { Text, Chip, ListItem, Button, CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ListScreen = ({ navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [donations, setDonations] = useState([]);
    const [dateFilter, setDateFilter] = useState('newest');
    const [tempDateFilter, setTempDateFilter] = useState('newest');
    const [statusFilter, setStatusFilter] = useState('all');
    const [tempStatusFilter, setTempStatusFilter] = useState('all');
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    const filterTranslations = {
        all: 'Todos',
        ready: 'Listos',
        notready: 'No Listos',
        newest: 'Más nuevo',
        oldest: 'Más viejo',
    };

    // grab all documents in donationForms collection from firebase
    const getAcceptedDonations = async () => {
        setRefreshing(true);
        let forms = [];
        let q;
        const donations = collection(db, 'pickedup');

        if (dateFilter === 'newest') {
            q = query(donations, orderBy('dateCreated', 'desc'));
        } else if (dateFilter === 'oldest') {
            q = query(donations, orderBy('dateCreated', 'asc'));
        }

        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const ready =
                    data.pickup === undefined
                        ? false
                        : !(
                              data.pickup.driver === undefined ||
                              data.pickup.date === undefined
                          );
                if (statusFilter === 'all') {
                    forms.push({
                        id: doc.id,
                        data: data,
                    });
                } else if (statusFilter === 'ready') {
                    if (ready) {
                        forms.push({
                            id: doc.id,
                            data: data,
                        });
                    }
                } else if (statusFilter === 'notready') {
                    if (!ready) {
                        forms.push({
                            id: doc.id,
                            data: data,
                        });
                    }
                }
            });
            setDonations(forms);
        } catch (error) {
            console.error(error);
        }

        setRefreshing(false);
    };

    const getAge = (date) => {
        const difference = new Date().getTime() - date.getTime();
        const result = Math.round(difference) / (1000 * 3600 * 24);
        return result < 1 ? 'New' : result.toFixed(0) + ' days old';
    };

    // useEffect(() => {
    //     // refresh will trigger when the list screen is focused
    //     navigation.addListener('focus', () => {
    //         getAcceptedDonations();
    //     });
    // });

    useEffect(() => {
        getAcceptedDonations();
    }, [refreshKey]);

    return (
        <>
            <Modal
                visible={filterModalVisible}
                animationType='fade'
                transparent
            >
                <View style={styles.filterContainer}>
                    <View style={styles.filterBox}>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Icon
                                name='close'
                                color='#626b79'
                                size={20}
                                onPress={() => {
                                    setTempDateFilter(dateFilter);
                                    setTempStatusFilter(statusFilter);
                                    setFilterModalVisible(false);
                                }}
                            />
                        </View>
                        <View>
                            <Text style={styles.filterHeading}>
                                Fecha de realización
                            </Text>
                            <CheckBox
                                title='Más nuevo'
                                checked={tempDateFilter === 'newest'}
                                iconType='material-community'
                                checkedIcon='radiobox-marked'
                                uncheckedIcon='radiobox-blank'
                                checkedColor='#0074cb'
                                onPress={() => setTempDateFilter('newest')}
                            />
                            <CheckBox
                                title='Más viejo'
                                checked={tempDateFilter === 'oldest'}
                                iconType='material-community'
                                checkedIcon='radiobox-marked'
                                uncheckedIcon='radiobox-blank'
                                checkedColor='#0074cb'
                                onPress={() => setTempDateFilter('oldest')}
                            />
                        </View>
                        <View
                            style={{
                                borderBottomColor: 'rgba(0, 0, 0, 0.15)',
                                borderBottomWidth: 1,
                                marginVertical: 20,
                            }}
                        />
                        <View>
                            <Text style={styles.filterHeading}>Estado</Text>
                            <CheckBox
                                title='Listo'
                                checked={tempStatusFilter === 'ready'}
                                iconType='material-community'
                                checkedIcon='radiobox-marked'
                                uncheckedIcon='radiobox-blank'
                                checkedColor='#0074cb'
                                onPress={() => setTempStatusFilter('ready')}
                            />
                            <CheckBox
                                title='No Listo'
                                checked={tempStatusFilter === 'notready'}
                                iconType='material-community'
                                checkedIcon='radiobox-marked'
                                uncheckedIcon='radiobox-blank'
                                checkedColor='#0074cb'
                                onPress={() => setTempStatusFilter('notready')}
                            />
                            <CheckBox
                                title='Todos'
                                checked={tempStatusFilter === 'all'}
                                iconType='material-community'
                                checkedIcon='radiobox-marked'
                                uncheckedIcon='radiobox-blank'
                                checkedColor='#0074cb'
                                onPress={() => setTempStatusFilter('all')}
                            />
                        </View>
                        <View
                            style={{
                                borderBottomColor: 'rgba(0, 0, 0, 0.15)',
                                borderBottomWidth: 1,
                                marginVertical: 20,
                            }}
                        />
                        <View
                            style={{
                                alignItems: 'center',
                                marginBottom: 20,
                            }}
                        >
                            <Button
                                title='Filtrar'
                                onPress={() => {
                                    setStatusFilter(tempStatusFilter);
                                    setDateFilter(tempDateFilter);
                                    setFilterModalVisible(false);
                                    setRefreshKey((oldKey) => oldKey + 1);
                                }}
                                containerStyle={{ width: '92%' }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
            <View
                style={{
                    backgroundColor: 'white',
                    height: '8%',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingRight: 10,
                }}
            >
                <View style={{ flexDirection: 'row' }}>
                    <Chip
                        title={filterTranslations[dateFilter]}
                        icon={{
                            name: 'calendar',
                            type: 'material-community',
                            size: 20,
                            color: 'white',
                        }}
                        containerStyle={{
                            paddingLeft: 10,
                        }}
                        buttonStyle={{
                            backgroundColor: '#9fabbb',
                        }}
                    />
                    <Chip
                        title={filterTranslations[statusFilter]}
                        icon={{
                            name: 'view-list',
                            type: 'material-community',
                            size: 20,
                            color: 'white',
                        }}
                        containerStyle={{
                            paddingLeft: 10,
                        }}
                        buttonStyle={{
                            backgroundColor: '#9fabbb',
                        }}
                    />
                </View>
                <Icon
                    name='filter-variant'
                    color='#0074cb'
                    size={25}
                    onPress={() => setFilterModalVisible(true)}
                />
            </View>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={getAcceptedDonations}
                    />
                }
            >
                {donations.length === 0 && (
                    <View style={styles.noDonations}>
                        <Text
                            style={{
                                fontWeight: '400',
                                fontSize: 24,
                                color: '#626b79',
                            }}
                        >
                            Sin nuevas donaciones.
                        </Text>
                    </View>
                )}
                <View style={styles.donations}>
                    {donations.map((pd, idx) => {
                        const data = pd.data;
                        const id = pd.id;
                        return (
                            <ListItem
                                key={id}
                                onPress={() => {
                                    navigation.push('View', {
                                        id: id,
                                        data: data,
                                    });
                                }}
                                topDivider={idx === 0}
                                bottomDivider
                            >
                                <ListItem.Content>
                                    <ListItem.Title>
                                        {data.org !== undefined
                                            ? data.org.name
                                            : data.indiv.name.first +
                                              ' ' +
                                              data.indiv.name.last1 +
                                              (data.indiv.name.last2 === null
                                                  ? ''
                                                  : ` ${data.indiv.name.last2}`)}
                                    </ListItem.Title>
                                    <ListItem.Content
                                        style={{
                                            flex: 1,
                                            flexDirection: 'row',
                                            justifyContent: 'space-around',
                                            width: '100%',
                                            marginTop: 10,
                                        }}
                                    >
                                        <View>
                                            <Text>Conductor:</Text>
                                            <Text>
                                                {data.pickup.driverName}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text>Fecha:</Text>
                                            <Text>
                                                {data.pickup.date
                                                    .toDate()
                                                    .toLocaleDateString(
                                                        'es-CO'
                                                    )}
                                            </Text>
                                        </View>
                                    </ListItem.Content>
                                </ListItem.Content>
                                <ListItem.Chevron />
                            </ListItem>
                        );
                    })}
                </View>
            </ScrollView>
        </>
    );
};

export default ListScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 10,
        marginTop: 20,
    },
    filterContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(52, 52, 52, 0.8)',
    },
    filterBox: {
        justifyContent: 'center',
        padding: 20,
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    filterHeading: {
        marginLeft: 10,
        marginBottom: 5,
        fontSize: 18,
    },
    cardText: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    donations: {
        width: '100%',
    },
    noDonations: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionSheetButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 15,
        backgroundColor: 'white',
        padding: 15,
        margin: 15,
    },
    listItem: {
        width: '100%',
        flexDirection: 'column',
    },
    chips: {
        flex: 1,
        flexDirection: 'row',
    },
});