# Test

Run the tests using the following instructions.

## Instructions

### Clone the Network-Services repo.
```bash
git clone https://github.com/faranalytics/network-services.git
```
### Change directory into the relevant test directory.
```bash
cd network-services/tests/test
```
### Install the example dependencies.
```bash
npm install && npm update
```
### Build the application.
```bash
npm run clean:build
```
### Run the application.
```bash
npm run monitor
```
#### Output
```bash
▶ Test variations of uni-directional and bi-directional methods calls.
  ✔ Call a method that echos a string. (207.615191ms)
  ✔ Call a nested method and echo a string. (177.806276ms)
  ✔ Call a nested method that is defined in the super class and echo a string. (162.123323ms)
  ✔ Call a method that echos multiple arguments as an array of the arguments. (433.094951ms)
  ✔ Call echoString multiple times synchronously and asynchronously await their results. (375.622352ms)
  ✔ Call a method that bi-directionally calls another method. (2.222785ms)
  ✔ Call a method that throws an error. (2.373271ms)
  ✔ Call a method that bi-directionally calls another method that throws an Error. (1.903081ms)
  ✔ Call a nested method that throws an Error. (0.676592ms)
  ✔ Make a call that exceeds the QUEUE_SIZE_LIMIT (83.887087ms)
▶ Test variations of uni-directional and bi-directional methods calls. (1458.196747ms)

▶ Test subversive method calls.
  ✔ Call an undefined method. (8.320193ms)
  ✔ Call a method on a function. (1.196143ms)
▶ Test subversive method calls. (12.738393ms)

▶ Test bi-directional calls over a stream.Duplex in object mode.
  ✔ Call a method that bi-directionally calls another method. (2.567026ms)
▶ Test bi-directional calls over a stream.Duplex in object mode. (108.381586ms)
```