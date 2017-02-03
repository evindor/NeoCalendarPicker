/**
 * @flow
 *
 * Calendar Picker Component
 *
 * Copyright 2016 Yahoo Inc.
 * Licensed under the terms of the MIT license. See LICENSE file in the project root for terms.
 */


import React from 'react'
import {
  Dimensions,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native'

const {
  WEEKDAYS,
  MONTHS,
  MAX_ROWS,
  MAX_COLUMNS,
  getDaysInMonth,
} = require('./Util')

const makeStyles = require('./makeStyles')

// The styles in makeStyles are intially scaled to this width
const IPHONE6_WIDTH = 375
const initialScale = Dimensions.get('window').width / IPHONE6_WIDTH
let styles = StyleSheet.create(makeStyles(initialScale))

const Day = React.createClass({
  propTypes: {
    date: React.PropTypes.instanceOf(Date),
    onDayChange: React.PropTypes.func,
    maxDate: React.PropTypes.instanceOf(Date),
    minDate: React.PropTypes.instanceOf(Date),
    selected: React.PropTypes.bool,
    type: React.PropTypes.string,
    day: React.PropTypes.oneOfType([
      React.PropTypes.number,
      React.PropTypes.string,
    ]).isRequired,
    screenWidth: React.PropTypes.number,
    startFromMonday: React.PropTypes.bool,
    selectedDayColor: React.PropTypes.string,
    selectedDayTextColor: React.PropTypes.string,
    textStyle: Text.propTypes.style,
    highlightToday: React.PropTypes.bool,
    today: React.PropTypes.instanceOf(Date),
  },
  getDefaultProps() {
    return {
      onDayChange() {},
    }
  },

  getInitialState() {
    this.DAY_WIDTH = (this.props.screenWidth - 16) / 7
    this.SELECTED_DAY_WIDTH = (this.props.screenWidth - 16) / 7 - 10
    this.BORDER_RADIUS = this.SELECTED_DAY_WIDTH / 2
    return null
  },

  render() {
    const textStyle = this.props.textStyle
    const todayStyle = this.props.highlightToday ? styles.today : {}

    let selectedWrapperStyle = styles.dayWrapper
    if (this.props.type == 'start_range') { selectedWrapperStyle = styles.startDayWrapper } else if (this.props.type == 'end_range') { selectedWrapperStyle = styles.endDayWrapper }

    if (this.props.selected) {
      const selectedDayColorStyle = this.props.selectedDayColor ? {backgroundColor: this.props.selectedDayColor} : {}
      const selectedDayTextColorStyle = this.props.selectedDayTextColor ? {color: this.props.selectedDayTextColor} : {}
      const dayWrapperStyle = this.props.type == 'in_range' || this.props.type == 'start_range' || this.props.type == 'end_range' ? selectedDayColorStyle : {}
      return (
        <View style={[selectedWrapperStyle, dayWrapperStyle]}>
          <View style={[styles.dayButtonSelected, selectedDayColorStyle]}>
            <TouchableOpacity
              style={styles.dayButton}
              onPress={() => this.props.onDayChange(this.props.day)}
            >
              <Text style={[styles.dayLabel, textStyle, selectedDayTextColorStyle]}>
                {this.props.day}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    } else if (this.props.date < this.props.minDate || this.props.date > this.props.maxDate) {
      return (
        <View style={[styles.dayWrapper, todayStyle]}>
          <Text style={[styles.dayLabel, textStyle, styles.disabledTextColor]}>
            {this.props.day}
          </Text>
        </View>
      )
    }

    return (
      <View style={[styles.dayWrapper, todayStyle]}>
        <TouchableOpacity
          style={styles.dayButton}
          onPress={() => this.props.onDayChange(this.props.day)}
        >
          <Text style={[styles.dayLabel, textStyle]}>
            {this.props.day}
          </Text>
        </TouchableOpacity>
      </View>
    )
  },
})

const Days = React.createClass({
  propTypes: {
    maxDate: React.PropTypes.instanceOf(Date),
    minDate: React.PropTypes.instanceOf(Date),
    fromDate: React.PropTypes.instanceOf(Date),
    toDate: React.PropTypes.instanceOf(Date),
    date: React.PropTypes.instanceOf(Date).isRequired,
    month: React.PropTypes.number.isRequired,
    year: React.PropTypes.number.isRequired,
    onDayChange: React.PropTypes.func.isRequired,
    selectedDayColor: React.PropTypes.string,
    selectedDayTextColor: React.PropTypes.string,
    textStyle: Text.propTypes.style,
  },
  getInitialState() {
    return {
      selectedStates: [],
      selectedTypes: [],
    }
  },

  componentDidMount() {
    if (this.props.fromDate && this.props.toDate) { this.updateSelectedStates(this.props.fromDate.getDate(), this.props.toDate.getDate()) } else { this.updateSelectedStates(this.props.date.getDate()) }
  },

  // Trigger date change if new props are provided.
  // Typically, when selectedDate is changed programmatically.
  //
  componentWillReceiveProps(newProps) {
    if (newProps.fromDate && newProps.toDate) { this.updateSelectedStates(newProps.fromDate.getDate(), newProps.toDate.getDate()) } else { this.updateSelectedStates(newProps.date.getDate()) }
  },

  updateSelectedStates(dayStart, dayEnd) {
    let selectedStates = [],
      selectedTypes = [],
      daysInMonth = getDaysInMonth(this.props.month, this.props.year),
      i

    for (i = 1; i <= daysInMonth; i++) {
      if (i === dayStart && !dayEnd) {
        selectedTypes.push('single')
        selectedStates.push(true)
      } else if (i === dayStart && dayEnd) {
        selectedTypes.push('start_range')
        selectedStates.push(true)
      } else if (i === dayEnd && dayStart) {
        selectedTypes.push('end_range')
        selectedStates.push(true)
      } else if (i > dayStart && i < dayEnd) {
        selectedTypes.push('in_range')
        selectedStates.push(true)
      } else {
        selectedTypes.push('')
        selectedStates.push(false)
      }
    }

    this.setState({
      selectedStates,
      selectedTypes,
    })
  },

  onPressDay(day) {
    // this.updateSelectedStates(day);
    this.props.onDayChange({day})
  },

  // Not going to touch this one - I'd look at whether there is a more functional
  // way you can do this using something like `range`, `map`, `partition` and such
  // (see underscore.js), or just break it up into steps: first generate the array for
  // data, then map that into the components
  getCalendarDays() {
    let columns,
      matrix = [],
      i,
      j,
      month = this.props.month,
      year = this.props.year,
      currentDay = 0,
      thisMonthFirstDay = this.props.startFromMonday ? new Date(year, month, 0) : new Date(year, month, 1),
      slotsAccumulator = 0

    for (i = 0; i < MAX_ROWS; i++) { // Week rows
      columns = []

      for (j = 0; j < MAX_COLUMNS; j++) { // Day columns
        if (slotsAccumulator >= thisMonthFirstDay.getDay()) {
          if (currentDay < getDaysInMonth(month, year)) {
            columns.push(<Day
              key={j}
              day={currentDay + 1}
              selected={this.state.selectedStates[currentDay]}
              type={this.state.selectedTypes[currentDay]}
              date={new Date(year, month, currentDay + 1)}
              maxDate={this.props.maxDate}
              minDate={this.props.minDate}
              onDayChange={this.onPressDay}
              screenWidth={this.props.screenWidth}
              selectedDayColor={this.props.selectedDayColor}
              selectedDayTextColor={this.props.selectedDayTextColor}
              textStyle={this.props.textStyle}
            />)
            currentDay++
          }
        } else {
          columns.push(<Day
            key={j}
            day={''}
            screenWidth={this.props.screenWidth}
          />)
        }

        slotsAccumulator++
      }
      matrix[i] = []
      matrix[i].push(<View style={styles.weekRow}>{columns}</View>)
    }

    return matrix
  },

  render() {
    return <View style={styles.daysWrapper}>{ this.getCalendarDays() }</View>
  },

})

const WeekDaysLabels = React.createClass({
  propTypes: {
    screenWidth: React.PropTypes.number,
    textStyle: Text.propTypes.style,
  },
  getInitialState() {
    this.DAY_WIDTH = (this.props.screenWidth - 16) / 7
    return null
  },
  render() {
    return (
      <View style={styles.dayLabelsWrapper}>
        { (this.props.weekdays || WEEKDAYS).map((day, key) => <Text key={key} style={[styles.dayLabels, this.props.textStyle]}>{day}</Text>) }
      </View>
    )
  },
})

const HeaderControls = React.createClass({
  propTypes: {
    month: React.PropTypes.number.isRequired,
    year: React.PropTypes.number,
    getNextYear: React.PropTypes.func.isRequired,
    getPrevYear: React.PropTypes.func.isRequired,
    onMonthChange: React.PropTypes.func.isRequired,
    textStyle: Text.propTypes.style,
  },
  getInitialState() {
    return {
      selectedMonth: this.props.month,
    }
  },

  // Trigger date change if new props are provided.
  // Typically, when selectedDate is changed programmatically.
  //
  componentWillReceiveProps(newProps) {
    this.setState({
      selectedMonth: newProps.month,
    })
  },

  // Logic seems a bit awkawardly split up between here and the CalendarPicker
  // component, eg: getNextYear is actually modifying the state of the parent,
  // could just let header controls hold all of the logic and have CalendarPicker
  // `onChange` callback fire and update itself on each change
  getNext() {
    const next = this.state.selectedMonth + 1
    if (next > 11) {
      this.setState({selectedMonth: 0},
        // Run this function as a callback to ensure state is set first
        () => {
          this.props.getNextYear()
          this.props.onMonthChange(this.state.selectedMonth)
        },
      )
    } else {
      this.setState({selectedMonth: next},
        () => {
          this.props.onMonthChange(this.state.selectedMonth)
        },
      )
    }
  },

  getPrevious() {
    const prev = this.state.selectedMonth - 1
    if (prev < 0) {
      this.setState({selectedMonth: 11},
        // Run this function as a callback to ensure state is set first
        () => {
          this.props.getPrevYear()
          this.props.onMonthChange(this.state.selectedMonth)
        },
      )
    } else {
      this.setState({selectedMonth: prev},
        () => {
          this.props.onMonthChange(this.state.selectedMonth)
        },
      )
    }
  },

  previousMonthDisabled() {
    return (this.props.minDate &&
             (this.props.year < this.props.minDate.getFullYear() ||
               (this.props.year == this.props.minDate.getFullYear() && this.state.selectedMonth <= this.props.minDate.getMonth())
             )
    )
  },

  nextMonthDisabled() {
    return (this.props.maxDate &&
             (this.props.year > this.props.maxDate.getFullYear() ||
               (this.props.year == this.props.maxDate.getFullYear() && this.state.selectedMonth >= this.props.maxDate.getMonth())
             )
    )
  },

  render() {
    const textStyle = this.props.textStyle

    let previous
    if (this.previousMonthDisabled()) {
      previous = (
        <Text style={[styles.prev, textStyle, styles.disabledTextColor]}>{this.props.previousTitle || 'Previous'}</Text>
      )
    } else {
      previous = (
        <TouchableOpacity onPress={this.getPrevious}>
          <Text style={[styles.prev, textStyle]}>{this.props.previousTitle || 'Previous'}</Text>
        </TouchableOpacity>
      )
    }

    let next
    if (this.nextMonthDisabled()) {
      next = (
        <Text style={[styles.next, textStyle, styles.disabledTextColor]}>{this.props.nextTitle || 'Next'}</Text>
      )
    } else {
      next = (
        <TouchableOpacity onPress={this.getNext}>
          <Text style={[styles.next, textStyle]}>{this.props.nextTitle || 'Next'}</Text>
        </TouchableOpacity>
      )
    }

    return (
      <View style={styles.headerWrapper}>
        <View style={styles.monthSelector}>
          {previous}
        </View>
        <View>
          <Text style={[styles.monthLabel, textStyle]}>
            { (this.props.months || MONTHS)[this.state.selectedMonth] } { this.props.year }
          </Text>
        </View>
        <View style={styles.monthSelector}>
          {next}
        </View>

      </View>
    )
  },
})

const CalendarPicker = React.createClass({
  propTypes: {
    maxDate: React.PropTypes.instanceOf(Date),
    minDate: React.PropTypes.instanceOf(Date),
    fromDate: React.PropTypes.instanceOf(Date),
    toDate: React.PropTypes.instanceOf(Date),
    selectedDate: React.PropTypes.instanceOf(Date).isRequired,
    onDateChange: React.PropTypes.func,
    screenWidth: React.PropTypes.number,
    startFromMonday: React.PropTypes.bool,
    weekdays: React.PropTypes.array,
    months: React.PropTypes.array,
    previousTitle: React.PropTypes.string,
    nextTitle: React.PropTypes.string,
    selectedDayColor: React.PropTypes.string,
    selectedDayTextColor: React.PropTypes.string,
    scaleFactor: React.PropTypes.number,
    textStyle: Text.propTypes.style,
    highlightToday: React.PropTypes.bool,
    allowRangeSelection: React.PropTypes.bool,
  },
  getDefaultProps() {
    return {
      onDateChange() {},
      highlightToday: true,
    }
  },
  getInitialState() {
    if (this.props.scaleFactor !== undefined) {
      styles = StyleSheet.create(makeStyles(this.props.scaleFactor))
    }

    let startDate = this.props.selectedDate
    if (this.props.allowRangeSelection && this.props.fromDate) { startDate = this.props.fromDate }

    return {
      fromDate: this.props.fromDate,
      toDate: this.props.toDate,
      today: new Date(),
      date: startDate,
      day: startDate.getDate(),
      month: startDate.getMonth(),
      year: startDate.getFullYear(),
      selectedDay: [],
    }
  },

  // Trigger date change if new props are provided.
  // Typically, when selectedDate is changed programmatically.
  //
  componentWillReceiveProps(newProps) {
    let startDate = newProps.selectedDate
    if (newProps.allowRangeSelection && newProps.fromDate) { startDate = newProps.fromDate }

    this.setState({
      fromDate: newProps.fromDate,
      toDate: newProps.toDate,
      date: startDate,
      day: startDate.getDate(),
      month: startDate.getMonth(),
      year: startDate.getFullYear(),
    })
  },

  onDayChange(day) {
    this.setState({day: day.day}, () => { this.onDateChange() })
  },

  onMonthChange(month) {
    this.setState({month}, () => { this.onDateChange() })
  },

  getNextYear() {
    this.setState({year: this.state.year + 1}, () => { this.onDateChange() })
  },

  getPrevYear() {
    this.setState({year: this.state.year - 1}, () => { this.onDateChange() })
  },

  onDateChange() {
    let {
      day,
      month,
      year,
    } = this.state,
      date = new Date(year, month, day)

    if (!this.props.allowRangeSelection) {
      this.setState({date})
      this.props.onDateChange(date)
    } else {
      let fromDate = this.state.fromDate,
        toDate = this.state.toDate
      if (!fromDate) {
        fromDate = date
      } else if (!toDate) {
        if (date > fromDate) {
          toDate = date
        } else {
          fromDate = date
        }
      } else if (fromDate && toDate) {
        fromDate = date
        toDate = null
      }
      this.setState({fromDate, toDate})
      this.props.onDateChange({start_date: fromDate, end_date: toDate})
    }
  },

  render() {
    return (
      <View style={styles.calendar}>
        <HeaderControls
          maxDate={this.props.maxDate}
          minDate={this.props.minDate}
          year={this.state.year}
          month={this.state.month}
          onMonthChange={this.onMonthChange}
          getNextYear={this.getNextYear}
          getPrevYear={this.getPrevYear}
          months={this.props.months}
          previousTitle={this.props.previousTitle}
          nextTitle={this.props.nextTitle}
          textStyle={this.props.textStyle}
        />

        <WeekDaysLabels
          screenWidth={this.props.screenWidth}
          weekdays={this.props.weekdays}
          textStyle={this.props.textStyle}
        />

        <Days
          maxDate={this.props.maxDate}
          minDate={this.props.minDate}
          fromDate={this.state.fromDate}
          toDate={this.state.toDate}
          month={this.state.month}
          year={this.state.year}
          date={this.state.date}
          today={this.state.today}
          highlightToday={this.props.highlightToday}
          onDayChange={this.onDayChange}
          screenWidth={this.props.screenWidth}
          startFromMonday={this.props.startFromMonday}
          selectedDayColor={this.props.selectedDayColor}
          selectedDayTextColor={this.props.selectedDayTextColor}
          textStyle={this.props.textStyle}
        />
      </View>
    )
  },
})

module.exports = CalendarPicker